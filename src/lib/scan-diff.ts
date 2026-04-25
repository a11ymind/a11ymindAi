type DiffViolation = {
  axeId: string;
  help?: string | null;
  helpUrl?: string | null;
  impact?: string | null;
  selector?: string | null;
  instances?: { selector?: string | null }[];
};

export type RegressionDiffItem = {
  key: string;
  axeId: string;
  help: string;
  helpUrl: string | null;
  impact: string;
  selector: string | null;
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
  const currentMap = uniqueByLocation(current);
  const previousMap = uniqueByLocation(previous);

  const newItems = [...currentMap.entries()]
    .filter(([key]) => !previousMap.has(key))
    .map(([key, violation]) => normalizeItem(key, violation))
    .sort(compareDiffItems);

  const fixedItems = [...previousMap.entries()]
    .filter(([key]) => !currentMap.has(key))
    .map(([key, violation]) => normalizeItem(key, violation))
    .sort(compareDiffItems);

  let unchangedCount = 0;
  for (const key of currentMap.keys()) {
    if (previousMap.has(key)) unchangedCount += 1;
  }

  return {
    newItems,
    fixedItems,
    unchangedCount,
    newCount: newItems.length,
    fixedCount: fixedItems.length,
  };
}

function uniqueByLocation(violations: DiffViolation[]) {
  const map = new Map<string, DiffViolation & { selector?: string | null }>();
  for (const violation of violations) {
    for (const selector of selectorsFor(violation)) {
      const key = signatureFor(violation.axeId, selector);
      if (!map.has(key)) {
        map.set(key, { ...violation, selector });
      }
    }
  }
  return map;
}

function selectorsFor(violation: DiffViolation): (string | null)[] {
  const selectors = (violation.instances ?? [])
    .map((instance) => normalizeSelector(instance.selector))
    .filter((selector): selector is string => Boolean(selector));

  if (selectors.length > 0) return unique(selectors);

  const parentSelector = normalizeSelector(violation.selector);
  return [parentSelector];
}

function normalizeSelector(selector: string | null | undefined): string | null {
  const normalized = selector?.trim();
  return normalized ? normalized : null;
}

function signatureFor(axeId: string, selector: string | null): string {
  return selector ? `${axeId}|${selector}` : axeId;
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function normalizeItem(
  key: string,
  violation: DiffViolation & { selector?: string | null },
): RegressionDiffItem {
  return {
    key,
    axeId: violation.axeId,
    help: violation.help?.trim() || violation.axeId,
    helpUrl: violation.helpUrl ?? null,
    impact: normalizeImpact(violation.impact),
    selector: normalizeSelector(violation.selector),
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
  const helpDelta = a.help.localeCompare(b.help);
  if (helpDelta !== 0) return helpDelta;
  return (a.selector ?? "").localeCompare(b.selector ?? "");
}

function impactRank(impact: string) {
  return IMPACT_RANK[impact] ?? IMPACT_RANK.minor;
}
