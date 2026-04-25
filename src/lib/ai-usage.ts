import { Prisma, type Plan } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { entitlementsFor } from "@/lib/entitlements";

export type AiUsageSummary = {
  aiEnabled: boolean;
  aiUsageCurrent: number;
  aiUsageLimit: number | null;
  aiUsageRemaining: number | null;
  aiLimitReached: boolean;
  requiresLoginForAI: boolean;
  requiresUpgradeForAI: boolean;
};

function aiUsageLimitForPlan(plan: Plan | null): number | null {
  if (!plan) return null;
  const ent = entitlementsFor(plan);
  return ent.aiFixes ? ent.aiMonthlyLimit : null;
}

function monthWindow(now: Date): { start: Date; end: Date } {
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  return {
    start: new Date(Date.UTC(year, month, 1, 0, 0, 0, 0)),
    end: new Date(Date.UTC(year, month + 1, 1, 0, 0, 0, 0)),
  };
}

function monthKey(now: Date): string {
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function buildSummary(input: {
  aiEnabled: boolean;
  aiUsageCurrent: number;
  aiUsageLimit: number | null;
  aiLimitReached: boolean;
  requiresLoginForAI: boolean;
  requiresUpgradeForAI: boolean;
}): AiUsageSummary {
  const aiUsageRemaining =
    input.aiUsageLimit === null
      ? null
      : Math.max(0, input.aiUsageLimit - input.aiUsageCurrent);

  return {
    ...input,
    aiUsageRemaining,
  };
}

export async function getAiUsageSummary(
  userId: string | null,
  plan: Plan | null,
  now = new Date(),
): Promise<AiUsageSummary> {
  if (!userId) {
    return buildSummary({
      aiEnabled: false,
      aiUsageCurrent: 0,
      aiUsageLimit: null,
      aiLimitReached: false,
      requiresLoginForAI: true,
      requiresUpgradeForAI: false,
    });
  }

  const limit = aiUsageLimitForPlan(plan);
  if (limit === null) {
    return buildSummary({
      aiEnabled: false,
      aiUsageCurrent: 0,
      aiUsageLimit: null,
      aiLimitReached: false,
      requiresLoginForAI: false,
      requiresUpgradeForAI: true,
    });
  }

  const current = await countAiUsagesThisMonth(userId, now);
  const aiLimitReached = current >= limit;
  const aiEnabled = Boolean(process.env.ANTHROPIC_API_KEY) && !aiLimitReached;

  return buildSummary({
    aiEnabled,
    aiUsageCurrent: current,
    aiUsageLimit: limit,
    aiLimitReached,
    requiresLoginForAI: false,
    requiresUpgradeForAI: false,
  });
}

export async function reserveAiUsageSlot(
  scanId: string,
  userId: string,
  plan: Plan,
  now = new Date(),
): Promise<
  | { ok: false; summary: AiUsageSummary }
  | { ok: true; summary: AiUsageSummary }
> {
  const limit = aiUsageLimitForPlan(plan);
  if (limit === null) {
    return {
      ok: false,
      summary: await getAiUsageSummary(userId, plan, now),
    };
  }

  const month = monthKey(now);

  try {
    const summary = await prisma.$transaction(
      async (tx) => {
        const reserved = await tx.scan.updateMany({
          where: {
            id: scanId,
            userId,
            status: "RUNNING",
            aiReservedMonth: null,
          },
          data: {
            aiReservedMonth: month,
          },
        });

        if (reserved.count === 0) {
          return buildSummary({
            aiEnabled: false,
            aiUsageCurrent: await countAiUsagesThisMonth(userId, now, tx),
            aiUsageLimit: limit,
            aiLimitReached: true,
            requiresLoginForAI: false,
            requiresUpgradeForAI: false,
          });
        }

        const current = await countAiUsagesThisMonth(userId, now, tx, month);
        const aiLimitReached = current > limit;

        if (aiLimitReached) {
          await tx.scan.update({
            where: { id: scanId },
            data: { aiReservedMonth: null },
          });
        }

        return buildSummary({
          aiEnabled: Boolean(process.env.ANTHROPIC_API_KEY) && !aiLimitReached,
          aiUsageCurrent: aiLimitReached ? current - 1 : current,
          aiUsageLimit: limit,
          aiLimitReached,
          requiresLoginForAI: false,
          requiresUpgradeForAI: false,
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    if (!summary.aiEnabled) {
      return { ok: false, summary };
    }

    return {
      ok: true,
      summary,
    };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") {
      return {
        ok: false,
        summary: await getAiUsageSummary(userId, plan, now),
      };
    }
    throw error;
  }
}

async function countAiUsagesThisMonth(
  userId: string,
  now: Date,
  db: Pick<typeof prisma, "scan"> = prisma,
  includeReservationMonth?: string,
): Promise<number> {
  const { start, end } = monthWindow(now);

  return db.scan.count({
    where: {
      userId,
      createdAt: {
        gte: start,
        lt: end,
      },
      OR: [
        {
          status: "COMPLETED",
          violations: {
            some: aiGeneratedViolationFilter(),
          },
        },
        ...(includeReservationMonth
          ? [
              {
                status: "RUNNING" as const,
                aiReservedMonth: includeReservationMonth,
              },
            ]
          : []),
      ],
    },
  });
}

export async function clearAiReservation(scanId: string): Promise<void> {
  await prisma.scan.updateMany({
    where: {
      id: scanId,
      aiReservedMonth: { not: null },
    },
    data: {
      aiReservedMonth: null,
    },
  });
}

function aiGeneratedViolationFilter(): Prisma.ViolationWhereInput {
  return {
    OR: [
      { legalRationale: { not: null } },
      { codeExample: { not: null } },
    ],
  };
}
