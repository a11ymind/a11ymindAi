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
    await prisma.scan.update({
      where: { id: scan.id },
      data: { status: "FAILED", error: message },
    });
    return { ok: false, scanId: scan.id, error: message };
  }
}

async function maybeGenerateAiFixes(
  scanId: string,
  userId: string | null,
  plan: Plan | null,
  violations: Awaited<ReturnType<typeof scanUrl>>["violations"],
): Promise<{ fixes: Awaited<ReturnType<typeof generateFixes>>; summary: AiUsageSummary }> {
  const summary = await getAiUsageSummary(userId, plan);

  if (!summary.aiEnabled || violations.length === 0 || !userId) {
    return { fixes: [], summary };
  }

  const reservablePlan = plan === "STARTER" || plan === "PRO" ? plan : null;
  if (!reservablePlan) {
    return { fixes: [], summary };
  }

  const reservation = await reserveAiUsageSlot(scanId, userId, reservablePlan);
  if (!reservation.ok) {
    return { fixes: [], summary: reservation.summary };
  }

  let fixes: Awaited<ReturnType<typeof generateFixes>> = [];
  try {
    fixes = await generateFixes(violations);
  } catch {
    fixes = [];
  }

  if (fixes.length === 0) {
    await clearAiReservation(scanId);
    return {
      fixes: [],
      summary: await getAiUsageSummary(userId, reservablePlan),
    };
  }

  return { fixes, summary: reservation.summary };
}

export function cadenceWindowStart(cadence: AutoScan, now: Date): Date | null {
  if (cadence === "none") return null;

  const windowDays = cadence === "weekly" ? 7 : 30;
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
