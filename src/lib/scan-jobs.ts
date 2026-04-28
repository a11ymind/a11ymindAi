import { Prisma, type Plan, type ViolationStatus } from "@prisma/client";
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
  workspaceId: true,
  siteId: true,
  projectId: true,
  pageId: true,
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

// If a function times out mid-scan, the Scan row can stay in PENDING/RUNNING
// forever and its AI reservation slot may remain consumed. Before kicking off
// a new scan we clean up any of the user's own stale in-flight rows.
const STALE_SCAN_THRESHOLD_MS = 5 * 60 * 1000;

export async function reapStaleRunningScans(
  userId: string,
  now = new Date(),
): Promise<number> {
  const cutoff = new Date(now.getTime() - STALE_SCAN_THRESHOLD_MS);
  const { count } = await prisma.scan.updateMany({
    where: {
      userId,
      status: { in: ["PENDING", "RUNNING"] },
      OR: [
        { startedAt: { lt: cutoff } },
        { startedAt: null, createdAt: { lt: cutoff } },
      ],
    },
    data: {
      status: "FAILED",
      error: "Scan timed out",
      lastRunError: "Scan timed out",
      completedAt: now,
      aiReservedMonth: null,
    },
  });
  return count;
}

export async function createScanRecord(input: {
  url: string;
  userId: string | null;
  workspaceId?: string | null;
  siteId: string | null;
  projectId?: string | null;
  pageId?: string | null;
}): Promise<PersistedScan> {
  return prisma.scan.create({
    data: {
      url: input.url,
      score: 0,
      status: "PENDING",
      userId: input.userId,
      workspaceId: input.workspaceId ?? null,
      siteId: input.siteId,
      projectId: input.projectId ?? null,
      pageId: input.pageId ?? null,
    },
    select: SCAN_RECORD_SELECT,
  });
}

function violationSignatureKey(axeId: string, selector: string): string {
  return `${axeId}|${selector}`;
}

function statusForRecurringViolation(
  previousStatus: ViolationStatus | undefined,
): ViolationStatus {
  // A shipped fix that still appears in the next scan needs attention again.
  if (previousStatus === "FIXED" || previousStatus === "VERIFIED") return "OPEN";
  return previousStatus ?? "OPEN";
}

async function findPreviousWorkflowScan(scan: PersistedScan) {
  if (!scan.userId) return null;

  const scope = scan.pageId
    ? { pageId: scan.pageId }
    : scan.siteId
      ? { siteId: scan.siteId }
      : { url: scan.url };

  return prisma.scan.findFirst({
    where: {
      ...scope,
      userId: scan.userId,
      status: "COMPLETED",
      id: { not: scan.id },
    },
    orderBy: { createdAt: "desc" },
    select: {
      violations: {
        select: {
          id: true,
          axeId: true,
          selector: true,
          status: true,
        },
      },
    },
  });
}

// Hard cap the entire scan, including AI fix generation. The Vercel function
// `maxDuration` is 300s; we time out at 240s so the scan can be cleanly
// marked FAILED before the function is killed and the scan would otherwise
// stay RUNNING until the stale-scan reaper fires.
const SCAN_TIMEOUT_MS = 240_000;
const SCAN_TIMEOUT_ERROR_MESSAGE = "Scan timed out";

function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  label: string,
  timeoutMessage?: string,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(timeoutMessage ?? `${label} exceeded ${ms / 1000}s timeout`)),
      ms,
    );
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

export async function executeScanRecord(
  scan: PersistedScan,
  userPlan: Plan | null,
): Promise<ExecuteScanResult> {
  try {
    const result = await withTimeout(
      scanUrl(scan.url),
      SCAN_TIMEOUT_MS,
      "Scan",
      SCAN_TIMEOUT_ERROR_MESSAGE,
    );
    const score = computeScore(result.violations);
    const ai = await maybeGenerateAiFixes(scan.id, scan.userId, userPlan, result.violations);
    const fixByAxeId = new Map(ai.fixes.map((fix) => [fix.axeId, fix]));
    const previousWorkflowScan = await findPreviousWorkflowScan(scan);
    const previousStatusBySignature = new Map(
      previousWorkflowScan?.violations.map((violation) => [
        violationSignatureKey(violation.axeId, violation.selector),
        violation.status,
      ]) ?? [],
    );
    const currentSignatures = new Set(
      result.violations.map((violation) =>
        violationSignatureKey(
          violation.id,
          violation.nodes[0]?.target?.join(" ") ?? "",
        ),
      ),
    );

    await prisma.$transaction(async (tx) => {
      for (const violation of result.violations) {
        const first = violation.nodes[0];
        const fix = fixByAxeId.get(violation.id);
        const selector = first?.target?.join(" ") ?? "";
        const previousStatus = previousStatusBySignature.get(
          violationSignatureKey(violation.id, selector),
        );
        const persisted = await tx.violation.create({
          data: {
            scanId: scan.id,
            axeId: violation.id,
            impact: violation.impact ?? "minor",
            description: violation.description,
            help: violation.help,
            helpUrl: violation.helpUrl,
            // Keep the first node on the parent row for compatibility with
            // existing reports/PDFs while storing all nodes below.
            element: first?.html?.slice(0, 4000) ?? "",
            selector,
            failureSummary: first?.failureSummary ?? null,
            legalRationale: fix?.legalRationale ?? null,
            plainEnglishFix: fix?.plainEnglishFix ?? null,
            codeExample: fix?.codeExample ?? null,
            aiDetails: fix
              ? {
                  verificationSteps: fix.verificationSteps,
                  acceptanceCriteria: fix.acceptanceCriteria,
                  developerTicket: fix.developerTicket,
                  confidence: fix.confidence,
                }
              : undefined,
            status: statusForRecurringViolation(previousStatus),
            statusUpdatedAt: previousStatus ? new Date() : null,
          },
          select: { id: true },
        });

        if (violation.nodes.length > 0) {
          await tx.violationInstance.createMany({
            data: violation.nodes.map((node, index) => ({
              violationId: persisted.id,
              ordinal: index,
              element: node.html?.slice(0, 4000) ?? "",
              selector: node.target?.join(" ") ?? "",
              failureSummary: node.failureSummary ?? null,
            })),
          });
        }
      }

      const verifiedViolationIds =
        previousWorkflowScan?.violations
          .filter(
            (violation) =>
              violation.status === "FIXED" &&
              !currentSignatures.has(
                violationSignatureKey(violation.axeId, violation.selector),
              ),
          )
          .map((violation) => violation.id) ?? [];

      if (verifiedViolationIds.length > 0) {
        await tx.violation.updateMany({
          where: { id: { in: verifiedViolationIds } },
          data: {
            status: "VERIFIED",
            statusUpdatedAt: new Date(),
          },
        });
        await tx.violationEvent.createMany({
          data: verifiedViolationIds.map((violationId) => ({
            violationId,
            userId: null,
            fromStatus: "FIXED",
            toStatus: "VERIFIED",
            note: "Automatically verified because this issue disappeared from the next scan.",
          })),
        });
      }

      await tx.scan.update({
        where: { id: scan.id },
        data: {
          score,
          status: "COMPLETED",
          url: result.finalUrl,
          error: null,
          lastRunError: null,
          completedAt: new Date(),
        },
      });
    });

    return { ok: true, scanId: scan.id, score, ai: ai.summary };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Scan failed";
    try {
      await prisma.scan.update({
        where: { id: scan.id },
        data: {
          status: "FAILED",
          error: message,
          lastRunError: message,
          completedAt: new Date(),
        },
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

    if (!userId) {
      console.warn(`[scan-jobs] AI skipped for scan ${scanId}: no userId (anonymous scan)`);
      return { fixes: [], summary };
    }
    if (!summary.aiEnabled) {
      console.warn(
        `[scan-jobs] AI skipped for scan ${scanId}: aiEnabled=false` +
        ` (ANTHROPIC_API_KEY set=${Boolean(process.env.ANTHROPIC_API_KEY)},` +
        ` plan=${plan}, limitReached=${summary.aiLimitReached},` +
        ` requiresUpgrade=${summary.requiresUpgradeForAI})`,
      );
      return { fixes: [], summary };
    }
    if (violations.length === 0) {
      return { fixes: [], summary };
    }

    if (!plan || !entitlementsFor(plan).aiFixes) {
      console.warn(`[scan-jobs] AI skipped for scan ${scanId}: plan=${plan} has no aiFixes entitlement`);
      return { fixes: [], summary };
    }

    const cached = await findCachedFixesForSite(scanId, violations);
    if (cached) {
      return { fixes: cached, summary };
    }

    const reservation = await reserveAiUsageSlot(scanId, userId, plan);
    if (!reservation.ok) {
      console.warn(`[scan-jobs] AI reservation failed for scan ${scanId}: slot unavailable`);
      try {
        await clearAiReservation(scanId);
      } catch (clearError) {
        console.warn(
          `[scan-jobs] failed to clear AI reservation after failed reserve for scan ${scanId}:`,
          clearError,
        );
      }
      return { fixes: [], summary: reservation.summary };
    }

    let fixes: Awaited<ReturnType<typeof generateFixes>> = [];
    try {
      fixes = await generateFixes(violations, plan);
    } catch (genError) {
      console.error(`[scan-jobs] generateFixes threw for scan ${scanId}:`, genError);
      fixes = [];
    }

    if (fixes.length === 0) {
      console.warn(`[scan-jobs] generateFixes returned 0 fixes for scan ${scanId} (${violations.length} violations, plan=${plan})`);
      await clearAiReservation(scanId);
      return {
        fixes: [],
        summary: await getAiUsageSummary(userId, plan),
      };
    }

    return { fixes, summary: reservation.summary };
  } catch (error) {
    // AI guidance is optional — keep the scan successful and fall back to no fixes.
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

async function findCachedFixesForSite(
  currentScanId: string,
  violations: AxeViolation[],
): Promise<AiFix[] | null> {
  if (violations.length === 0) return null;

  const current = await prisma.scan.findUnique({
    where: { id: currentScanId },
    select: { pageId: true, siteId: true },
  });
  if (!current?.pageId && !current?.siteId) return null;

  const previous = await prisma.scan.findFirst({
    where: {
      ...(current.pageId
        ? { pageId: current.pageId }
        : { siteId: current.siteId }),
      status: "COMPLETED",
      id: { not: currentScanId },
    },
    orderBy: { createdAt: "desc" },
    select: {
      violations: {
        select: {
          axeId: true,
          selector: true,
          legalRationale: true,
          plainEnglishFix: true,
          codeExample: true,
          aiDetails: true,
        },
      },
    },
  });
  if (!previous) return null;

  const prevSig = previous.violations
    .map((v) => `${v.axeId}|${v.selector}`)
    .sort()
    .join("\n");
  const currentSig = violations
    .map((v) => `${v.id}|${v.nodes[0]?.target?.join(" ") ?? ""}`)
    .sort()
    .join("\n");
  if (prevSig !== currentSig) return null;

  const fixes: AiFix[] = [];
  for (const v of previous.violations) {
    if (!v.legalRationale || !v.plainEnglishFix || !v.codeExample) {
      return null;
    }
    const details = cachedAiDetails(v.aiDetails);
    if (!details) return null;
    fixes.push({
      axeId: v.axeId,
      legalRationale: v.legalRationale,
      plainEnglishFix: v.plainEnglishFix,
      codeExample: v.codeExample,
      ...details,
    });
  }
  return fixes;
}

function cachedAiDetails(value: unknown): Omit<AiFix, "axeId" | "legalRationale" | "plainEnglishFix" | "codeExample"> | null {
  if (!value || typeof value !== "object") return null;
  const details = value as {
    verificationSteps?: unknown;
    acceptanceCriteria?: unknown;
    developerTicket?: unknown;
    confidence?: unknown;
  };
  if (
    !Array.isArray(details.verificationSteps) ||
    !Array.isArray(details.acceptanceCriteria) ||
    typeof details.developerTicket !== "string" ||
    (details.confidence !== "low" && details.confidence !== "medium" && details.confidence !== "high")
  ) {
    return null;
  }
  return {
    verificationSteps: details.verificationSteps.filter((item): item is string => typeof item === "string"),
    acceptanceCriteria: details.acceptanceCriteria.filter((item): item is string => typeof item === "string"),
    developerTicket: details.developerTicket,
    confidence: details.confidence,
  };
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
            projectId: true,
            pageId: true,
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
            source: "SCHEDULED",
            startedAt: input.now,
            attemptCount: 1,
            userId: site.userId,
            siteId: site.id,
            projectId: site.projectId,
            pageId: site.pageId,
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
