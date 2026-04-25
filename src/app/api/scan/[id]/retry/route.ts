import { after, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  canRetryScan,
  MAX_SCAN_ATTEMPTS,
  retryAttemptsRemaining,
} from "@/lib/scan-retry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await getSession();

  const scan = await prisma.scan.findUnique({
    where: { id },
    select: {
      id: true,
      userId: true,
      status: true,
      attemptCount: true,
    },
  });

  if (!scan) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (scan.userId && scan.userId !== session?.user?.id) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (!canRetryScan(scan)) {
    return NextResponse.json(
      {
        error: "retry_not_available",
        attemptsRemaining: retryAttemptsRemaining(scan),
      },
      { status: 409 },
    );
  }

  const updated = await prisma.scan.updateMany({
    where: {
      id: scan.id,
      status: "FAILED",
      attemptCount: { lt: MAX_SCAN_ATTEMPTS },
    },
    data: {
      status: "PENDING",
      source: "WORKER_RETRY",
      error: null,
      startedAt: null,
      completedAt: null,
    },
  });

  if (updated.count === 0) {
    return NextResponse.json(
      { error: "retry_not_available", attemptsRemaining: 0 },
      { status: 409 },
    );
  }

  enqueueScanWorker(scan.id, req.url);

  return NextResponse.json({
    scanId: scan.id,
    status: "PENDING",
    attemptsRemaining: retryAttemptsRemaining(scan),
  });
}

function enqueueScanWorker(scanId: string, requestUrl: string) {
  const secret = process.env.SCAN_WORKER_SECRET;
  if (!secret) return;

  const baseUrl = workerBaseUrl(requestUrl);
  after(async () => {
    try {
      const res = await fetch(`${baseUrl}/api/internal/scan-worker`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${secret}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({ scanId }),
        cache: "no-store",
      });

      if (!res.ok) {
        console.error(
          `[scan/retry] scan worker returned ${res.status} for ${scanId}`,
        );
      }
    } catch (error) {
      console.error(`[scan/retry] failed to enqueue worker for ${scanId}:`, error);
    }
  });
}

function workerBaseUrl(requestUrl: string) {
  const configured =
    process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? null;
  if (configured) return configured.replace(/\/$/, "");
  return new URL(requestUrl).origin;
}
