import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const scan = await prisma.scan.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      score: true,
      error: true,
      lastRunError: true,
      source: true,
      startedAt: true,
      completedAt: true,
      attemptCount: true,
      url: true,
      createdAt: true,
    },
  });

  if (!scan) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({
    scanId: scan.id,
    status: scan.status,
    score: scan.status === "COMPLETED" ? scan.score : null,
    error: scan.error,
    lastRunError: scan.lastRunError,
    source: scan.source,
    startedAt: scan.startedAt?.toISOString() ?? null,
    completedAt: scan.completedAt?.toISOString() ?? null,
    attemptCount: scan.attemptCount,
    url: scan.url,
    createdAt: scan.createdAt.toISOString(),
  });
}
