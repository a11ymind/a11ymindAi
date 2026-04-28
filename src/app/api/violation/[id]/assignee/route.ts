import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
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
      scan: { select: { userId: true } },
    },
  });

  if (!violation || violation.scan.userId !== session.user.id) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const assigneeName = parsed.data.assigneeName?.trim() || null;
  const assigneeEmail = parsed.data.assigneeEmail?.trim() || null;
  const updated = await prisma.violation.update({
    where: { id },
    data: {
      assigneeName,
      assigneeEmail,
      assignedAt: assigneeName || assigneeEmail ? new Date() : null,
    },
    select: {
      id: true,
      assigneeName: true,
      assigneeEmail: true,
      assignedAt: true,
    },
  });

  return NextResponse.json(updated);
}
