import type { ScanStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { executeScanRecord } from "@/lib/scan-jobs";

export type RunPendingScanOutcome =
  | { ok: true; scanId: string; status: "COMPLETED"; score: number }
  | { ok: true; scanId: string; status: Exclude<ScanStatus, "COMPLETED">; error?: string | null }
  | { ok: false; status: 404; error: "not_found" }
  | { ok: false; status: 403; error: "forbidden" }
  | { ok: false; status: 500; scanId: string; error: string };

export async function runPendingScan(input: {
  scanId: string;
  userId?: string | null;
  bypassOwnership?: boolean;
}): Promise<RunPendingScanOutcome> {
  const scan = await prisma.scan.findUnique({
    where: { id: input.scanId },
    select: {
      id: true,
      url: true,
      userId: true,
      siteId: true,
      projectId: true,
      pageId: true,
      status: true,
      score: true,
      error: true,
      user: { select: { plan: true } },
    },
  });

  if (!scan) return { ok: false, status: 404, error: "not_found" };
  if (!input.bypassOwnership && scan.userId && scan.userId !== input.userId) {
    return { ok: false, status: 403, error: "forbidden" };
  }

  if (scan.status === "COMPLETED") {
    return {
      ok: true,
      scanId: scan.id,
      status: scan.status,
      score: scan.score,
    };
  }

  if (scan.status === "FAILED") {
    return {
      ok: true,
      scanId: scan.id,
      status: scan.status,
      error: scan.error,
    };
  }

  if (scan.status === "RUNNING") {
    return { ok: true, scanId: scan.id, status: scan.status };
  }

  const claimed = await prisma.scan.updateMany({
    where: { id: scan.id, status: "PENDING" },
    data: {
      status: "RUNNING",
      startedAt: new Date(),
      completedAt: null,
      lastRunError: null,
      attemptCount: { increment: 1 },
    },
  });

  if (claimed.count === 0) {
    const latest = await prisma.scan.findUnique({
      where: { id: scan.id },
      select: { status: true, score: true, error: true },
    });
    if (latest?.status === "COMPLETED") {
      return {
        ok: true,
        scanId: scan.id,
        status: "COMPLETED",
        score: latest.score,
      };
    }
    return {
      ok: true,
      scanId: scan.id,
      status: latest?.status ?? "RUNNING",
      error: latest?.error ?? null,
    };
  }

  const result = await executeScanRecord(
    {
      id: scan.id,
      url: scan.url,
      userId: scan.userId,
      siteId: scan.siteId,
      projectId: scan.projectId,
      pageId: scan.pageId,
    },
    scan.user?.plan ?? null,
  );

  if (!result.ok) {
    return {
      ok: false,
      status: 500,
      scanId: result.scanId,
      error: result.error,
    };
  }

  return {
    ok: true,
    scanId: result.scanId,
    status: "COMPLETED",
    score: result.score,
  };
}
