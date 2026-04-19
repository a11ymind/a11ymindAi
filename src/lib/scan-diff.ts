type DiffViolation = {
  axeId: string;
  help?: string | null;
  helpUrl?: string | null;
  impact?: string | null;
};

export type RegressionDiffItem = {
  axeId: string;
  help: string;
  helpUrl: string | null;
  impact: string;
};

export type RegressionDiff = {
  newItems: RegressionDiffItem[];
  fixedItems: RegressionDiffItem[];
  unchangedCount: number;
  newCount: number;
  fixedCount: number;
};

const IMPACT_RANK: Record<string, number> = {
  critical: 0,
  serious: 1,
  moderate: 2,
  minor: 3,
};

export function buildRegressionDiff(
  current: DiffViolation[],
  previous: DiffViolation[],
): RegressionDiff {
  const currentMap = uniqueByAxeId(current);
  const previousMap = uniqueByAxeId(previous);

  const newItems = [...currentMap.entries()]
    .filter(([axeId]) => !previousMap.has(axeId))
    .map(([, violation]) => normalizeItem(violation))
    .sort(compareDiffItems);

  const fixedItems = [...previousMap.entries()]
    .filter(([axeId]) => !currentMap.has(axeId))
    .map(([, violation]) => normalizeItem(violation))
    .sort(compareDiffItems);

  let unchangedCount = 0;
  for (const axeId of currentMap.keys()) {
    if (previousMap.has(axeId)) unchangedCount += 1;
  }

  return {
    newItems,
    fixedItems,
    unchangedCount,
    newCount: newItems.length,
    fixedCount: fixedItems.length,
  };
}

function uniqueByAxeId(violations: DiffViolation[]) {
  const map = new Map<string, DiffViolation>();
  for (const violation of violations) {
    if (!map.has(violation.axeId)) {
      map.set(violation.axeId, violation);
    }
  }
  return map;
}

function normalizeItem(violation: DiffViolation): RegressionDiffItem {
  return {
    axeId: violation.axeId,
    help: violation.help?.trim() || violation.axeId,
    helpUrl: violation.helpUrl ?? null,
    impact: normalizeImpact(violation.impact),
  };
}

function normalizeImpact(impact: string | null | undefined) {
  if (
    impact === "critical" ||
    impact === "serious" ||
    impact === "moderate" ||
    impact === "minor"
  ) {
    return impact;
  }
  return "minor";
}

function compareDiffItems(a: RegressionDiffItem, b: RegressionDiffItem) {
  const impactDelta = impactRank(a.impact) - impactRank(b.impact);
  if (impactDelta !== 0) return impactDelta;
  return a.help.localeCompare(b.help);
}

function impactRank(impact: string) {
  return IMPACT_RANK[impact] ?? IMPACT_RANK.minor;
}
