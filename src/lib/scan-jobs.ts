import { Prisma, type Plan } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { generateFixes } from "@/lib/ai";
import {
  clearAiReservation,
  getAiUsageSummary,
  reserveAiUsageSlot,
  type AiUsageSummary,
} from "@/lib/ai-usage";
import { entitlementsFor, type AutoScan } from "@/lib/entitlements";
import { scanUrl } from "@/lib/scan";
import type { AxeViolation } from "@/lib/scan";
import type { AiFix } from "@/lib/ai";
import { computeScore } from "@/lib/score";

const SCAN_RECORD_SELECT = {
  id: true,
  url: true,
  userId: true,
  siteId: true,
} satisfies Prisma.ScanSelect;

type PersistedScan = Prisma.ScanGetPayload<{ select: typeof SCAN_RECORD_SELECT }>;

export type ExecuteScanResult =
  | { ok: true; scanId: string; score: number; ai: AiUsageSummary }
  | { ok: false; scanId: string; error: string };

function disabledAiSummary(userId: string | null, plan: Plan | null): AiUsageSummary {
  return {
    aiEnabled: false,
    aiUsageCurrent: 0,
    aiUsageLimit: plan ? entitlementsFor(plan).aiMonthlyLimit : null,
    aiUsageRemaining: plan ? entitlementsFor(plan).aiMonthlyLimit : null,
    aiLimitReached: false,
    requiresLoginForAI: !userId,
    requiresUpgradeForAI: Boolean(userId && (!plan || !entitlementsFor(plan).aiFixes)),
  };
}

// Scans are executed inline with maxDuration=60. If a function times out
// mid-transaction, the Scan row stays in RUNNING forever and (pre-fix) its
// AI reservation slot is permanently consumed. Before kicking off a new scan
// we clean up any of the user's own stale RUNNING rows.
const STALE_SCAN_THRESHOLD_MS = 5 * 60 * 1000;

export async function reapStaleRunningScans(
  userId: string,
  now = new Date(),
): Promise<number> {
  const cutoff = new Date(now.getTime() - STALE_SCAN_THRESHOLD_MS);
  const { count } = await prisma.scan.updateMany({
    where: {
      userId,
      status: "RUNNING",
      createdAt: { lt: cutoff },
    },
    data: {
      status: "FAILED",
      error: "Scan timed out",
      aiReservedMonth: null,
    },
  });
  return count;
}

export async function createScanRecord(input: {
  url: string;
  userId: string | null;
  siteId: string | null;
}): Promise<PersistedScan> {
  return prisma.scan.create({
    data: {
      url: input.url,
      score: 0,
      status: "RUNNING",
      userId: input.userId,
      siteId: input.siteId,
    },
    select: SCAN_RECORD_SELECT,
  });
}

export async function executeScanRecord(
  scan: PersistedScan,
  userPlan: Plan | null,
): Promise<ExecuteScanResult> {
  try {
    const result = await scanUrl(scan.url);
    const score = computeScore(result.violations);
    const ai = await maybeGenerateAiFixes(scan.id, scan.userId, userPlan, result.violations);
    const fixByAxeId = new Map(ai.fixes.map((fix) => [fix.axeId, fix]));

    await prisma.$transaction([
      prisma.violation.createMany({
        data: result.violations.map((violation) => {
          const first = violation.nodes[0];
          const fix = fixByAxeId.get(violation.id);
          return {
            scanId: scan.id,
            axeId: violation.id,
            impact: violation.impact ?? "minor",
            description: violation.description,
            help: violation.help,
            helpUrl: violation.helpUrl,
            element: first?.html?.slice(0, 4000) ?? "",
            selector: first?.target?.join(" ") ?? "",
            failureSummary: first?.failureSummary ?? null,
            legalRationale: fix?.legalRationale ?? null,
            plainEnglishFix: fix?.plainEnglishFix ?? null,
            codeExample: fix?.codeExample ?? null,
          };
        }),
      }),
      prisma.scan.update({
        where: { id: scan.id },
        data: { score, status: "COMPLETED", url: result.finalUrl, error: null },
      }),
    ]);

    return { ok: true, scanId: scan.id, score, ai: ai.summary };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Scan failed";
    try {
      await prisma.scan.update({
        where: { id: scan.id },
        data: { status: "FAILED", error: message },
      });
    } catch (updateError) {
      console.error(`[scan-jobs] failed to persist scan failure for ${scan.id}:`, updateError);
    }
    return { ok: false, scanId: scan.id, error: message };
  }
}

async function maybeGenerateAiFixes(
  scanId: string,
  userId: string | null,
  plan: Plan | null,
  violations: Awaited<ReturnType<typeof scanUrl>>["violations"],
): Promise<{ fixes: Awaited<ReturnType<typeof generateFixes>>; summary: AiUsageSummary }> {
  try {
    const summary = await getAiUsageSummary(userId, plan);

    if (!summary.aiEnabled || violations.length === 0 || !userId) {
      return { fixes: [], summary };
    }

    if (!plan || !entitlementsFor(plan).aiFixes) {
      return { fixes: [], summary };
    }

    const cached = await findCachedFixesForSite(scanId, violations);
    if (cached) {
      return { fixes: cached, summary };
    }

    const reservation = await reserveAiUsageSlot(scanId, userId, plan);
    if (!reservation.ok) {
      return { fixes: [], summary: reservation.summary };
    }

    let fixes: Awaited<ReturnType<typeof generateFixes>> = [];
    try {
      fixes = await generateFixes(violations, plan);
    } catch {
      fixes = [];
    }

    if (fixes.length === 0) {
      await clearAiReservation(scanId);
      return {
        fixes: [],
        summary: await getAiUsageSummary(userId, plan),
      };
    }

    return { fixes, summary: reservation.summary };
  } catch (error) {
    // AI guidance is optional. If the paid-only remediation path throws at
    // runtime, keep the scan itself successful and fall back to no fixes.
    console.error(`[scan-jobs] AI generation fallback for scan ${scanId}:`, error);
    try {
      await clearAiReservation(scanId);
    } catch (clearError) {
      console.error(`[scan-jobs] failed to clear AI reservation for ${scanId}:`, clearError);
    }

    let summary: AiUsageSummary;
    try {
      summary = await getAiUsageSummary(userId, plan);
    } catch (summaryError) {
      console.error(`[scan-jobs] failed to read AI usage summary for ${scanId}:`, summaryError);
      summary = disabledAiSummary(userId, plan);
    }

    return {
      fixes: [],
      summary,
    };
  }
}

function violationSignature(violations: Pick<AxeViolation, "id" | "nodes">[]): string {
  return violations
    .map((v) => `${v.id}|${v.nodes[0]?.target?.join(" ") ?? ""}`)
    .sort()
    .join("\n");
}

async function findCachedFixesForSite(
  currentScanId: string,
  violations: AxeViolation[],
): Promise<AiFix[] | null> {
  if (violations.length === 0) return null;

  const current = await prisma.scan.findUnique({
    where: { id: currentScanId },
    select: { siteId: true },
  });
  if (!current?.siteId) return null;

  const previous = await prisma.scan.findFirst({
    where: {
      siteId: current.siteId,
      status: "COMPLETED",
      id: { not: currentScanId },
    },
    orderBy: { createdAt: "desc" },
    select: {
      violations: {
        select: {
          axeId: true,
          selector: true,
          plainEnglishFix: true,
          legalRationale: true,
          codeExample: true,
        },
      },
    },
  });
  if (!previous) return null;

  const prevSig = previous.violations
    .map((v) => `${v.axeId}|${v.selector}`)
    .sort()
    .join("\n");
  if (prevSig !== violationSignature(violations)) return null;

  const fixes: AiFix[] = [];
  for (const v of previous.violations) {
    if (!v.plainEnglishFix || !v.legalRationale || !v.codeExample) {
      return null;
    }
    fixes.push({
      axeId: v.axeId,
      plainEnglishFix: v.plainEnglishFix,
      legalRationale: v.legalRationale,
      codeExample: v.codeExample,
    });
  }
  return fixes;
}

export function cadenceWindowStart(cadence: AutoScan, now: Date): Date | null {
  if (cadence === "none") return null;

  const windowDays = cadence === "daily" ? 1 : cadence === "weekly" ? 7 : 30;
  return new Date(now.getTime() - windowDays * 24 * 60 * 60 * 1000);
}

export function isDueForAutoScan(
  lastScanAt: Date | null | undefined,
  cadence: AutoScan,
  now: Date,
): boolean {
  const windowStart = cadenceWindowStart(cadence, now);
  if (!windowStart) return false;
  if (!lastScanAt) return true;
  return lastScanAt < windowStart;
}

export async function reserveScheduledScan(input: {
  siteId: string;
  now: Date;
}): Promise<
  | { ok: true; scan: PersistedScan; plan: Plan; cadence: Exclude<AutoScan, "none"> }
  | { ok: false; reason: string }
> {
  try {
    return await prisma.$transaction(
      async (tx) => {
        const site = await tx.site.findUnique({
          where: { id: input.siteId },
          select: {
            id: true,
            url: true,
            userId: true,
            user: { select: { plan: true } },
          },
        });

        if (!site) {
          return { ok: false, reason: "site_missing" } as const;
        }

        const cadence = entitlementsFor(site.user.plan).autoScan;
        if (cadence === "none") {
          return { ok: false, reason: "plan_not_eligible" } as const;
        }

        const windowStart = cadenceWindowStart(cadence, input.now);
        if (!windowStart) {
          return { ok: false, reason: "plan_not_eligible" } as const;
        }

        const recent = await tx.scan.findFirst({
          where: {
            siteId: site.id,
            createdAt: { gte: windowStart },
          },
          orderBy: { createdAt: "desc" },
          select: { id: true },
        });

        if (recent) {
          return { ok: false, reason: "already_scanned_in_window" } as const;
        }

        const scan = await tx.scan.create({
          data: {
            url: site.url,
            score: 0,
            status: "RUNNING",
            userId: site.userId,
            siteId: site.id,
          },
          select: SCAN_RECORD_SELECT,
        });

        return { ok: true, scan, plan: site.user.plan, cadence } as const;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  } catch (error) {
    if (isSerializableConflict(error)) {
      return { ok: false, reason: "reservation_conflict" };
    }
    throw error;
  }
}

function isSerializableConflict(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034"
  );
}
