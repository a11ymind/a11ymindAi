import { NextResponse } from "next/server";
import type { ViolationStatus } from "@prisma/client";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessWorkspaceResource } from "@/lib/workspaces";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "IGNORED", "FIXED", "VERIFIED"]),
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
    return NextResponse.json({ error: "invalid_status" }, { status: 400 });
  }

  const violation = await prisma.violation.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      scan: {
        select: {
          userId: true,
          workspaceId: true,
        },
      },
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

  const updated = await prisma.$transaction(async (tx) => {
    const nextStatus = parsed.data.status as ViolationStatus;
    const result = await tx.violation.update({
      where: { id },
      data: {
        status: nextStatus,
        statusUpdatedAt: new Date(),
      },
      select: {
        id: true,
        status: true,
        statusUpdatedAt: true,
      },
    });

    if (violation.status !== nextStatus) {
      await tx.violationEvent.create({
        data: {
          violationId: id,
          userId: session.user.id,
          fromStatus: violation.status,
          toStatus: nextStatus,
        },
      });
    }

    return result;
  });

  return NextResponse.json(updated);
}
