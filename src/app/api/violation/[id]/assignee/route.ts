import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { entitlementsFor } from "@/lib/entitlements";
import { canAccessWorkspaceResource } from "@/lib/workspaces";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  assigneeUserId: z.string().trim().min(1).optional().nullable(),
  assigneeName: z.string().trim().max(120).optional(),
  assigneeEmail: z.string().trim().email().max(254).or(z.literal("")).optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = Body.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_assignee" }, { status: 400 });
  }

  const violation = await prisma.violation.findUnique({
    where: { id },
    select: {
      id: true,
      scan: { select: { userId: true, workspaceId: true } },
    },
  });

  if (
    !violation ||
    !(await canAccessWorkspaceResource({
      userId: session.user.id,
      ownerUserId: violation.scan.userId,
      workspaceId: violation.scan.workspaceId,
    }))
  ) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const assigneeUserId = parsed.data.assigneeUserId?.trim() || null;
  let assigneeName = parsed.data.assigneeName?.trim() || null;
  let assigneeEmail = parsed.data.assigneeEmail?.trim() || null;

  if (assigneeUserId) {
    const owner = violation.scan.userId
      ? await prisma.user.findUnique({
          where: { id: violation.scan.userId },
          select: { plan: true },
        })
      : null;
    if (!owner || !entitlementsFor(owner.plan).teamMembers) {
      return NextResponse.json({ error: "upgrade_required" }, { status: 402 });
    }
    if (!violation.scan.workspaceId) {
      return NextResponse.json({ error: "workspace_required" }, { status: 400 });
    }
    const member = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: violation.scan.workspaceId,
          userId: assigneeUserId,
        },
      },
      select: {
        user: { select: { name: true, email: true } },
      },
    });
    if (!member) {
      return NextResponse.json({ error: "assignee_not_member" }, { status: 400 });
    }
    assigneeName = member.user.name;
    assigneeEmail = member.user.email;
  }

  const updated = await prisma.violation.update({
    where: { id },
    data: {
      assigneeUserId,
      assigneeName,
      assigneeEmail,
      assignedAt: assigneeUserId || assigneeName || assigneeEmail ? new Date() : null,
    },
    select: {
      id: true,
      assigneeUserId: true,
      assigneeName: true,
      assigneeEmail: true,
      assignedAt: true,
    },
  });

  return NextResponse.json(updated);
}
