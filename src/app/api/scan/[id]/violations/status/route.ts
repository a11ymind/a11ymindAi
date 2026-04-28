import { NextResponse } from "next/server";
import type { ViolationStatus } from "@prisma/client";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  violationIds: z.array(z.string().min(1)).min(1).max(100),
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
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const scan = await prisma.scan.findUnique({
    where: { id },
    select: { id: true, userId: true },
  });
  if (!scan || scan.userId !== session.user.id) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const nextStatus = parsed.data.status as ViolationStatus;
  const result = await prisma.$transaction(async (tx) => {
    const violations = await tx.violation.findMany({
      where: {
        scanId: id,
        id: { in: parsed.data.violationIds },
      },
      select: {
        id: true,
        status: true,
      },
    });

    const updateResult = await tx.violation.updateMany({
      where: {
        scanId: id,
        id: { in: violations.map((violation) => violation.id) },
      },
      data: {
        status: nextStatus,
        statusUpdatedAt: new Date(),
      },
    });

    const changed = violations.filter((violation) => violation.status !== nextStatus);
    if (changed.length > 0) {
      await tx.violationEvent.createMany({
        data: changed.map((violation) => ({
          violationId: violation.id,
          userId: session.user.id,
          fromStatus: violation.status,
          toStatus: nextStatus,
        })),
      });
    }

    return updateResult;
  });

  return NextResponse.json({
    updatedCount: result.count,
    status: parsed.data.status,
  });
}
