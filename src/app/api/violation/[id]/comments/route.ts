import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessWorkspaceResource } from "@/lib/workspaces";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  body: z.string().trim().min(1).max(2000),
});

export async function POST(
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
    return NextResponse.json({ error: "invalid_comment" }, { status: 400 });
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

  const comment = await prisma.violationComment.create({
    data: {
      violationId: id,
      userId: session.user.id,
      body: parsed.data.body,
    },
    select: {
      id: true,
      body: true,
      createdAt: true,
      user: { select: { name: true, email: true } },
    },
  });

  return NextResponse.json(comment, { status: 201 });
}
