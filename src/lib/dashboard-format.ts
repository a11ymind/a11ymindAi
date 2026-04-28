// Shared formatters used across dashboard, /issues, and /monitoring.

export function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function originOf(url: string): string {
  try {
    return new URL(url).origin;
  } catch {
    return url;
  }
}

export function bandColor(tone: "good" | "warn" | "bad"): string {
  return tone === "good" ? "#22c55e" : tone === "warn" ? "#f59e0b" : "#ef4444";
}

export function normalizeImpact(
  impact: string,
): "critical" | "serious" | "moderate" | "minor" {
  return impact === "critical" ||
    impact === "serious" ||
    impact === "moderate" ||
    impact === "minor"
    ? impact
    : "minor";
}

export function severityColor(impact: string): string {
  const normalized = normalizeImpact(impact);
  return {
    critical: "#ef4444",
    serious: "#f97316",
    moderate: "#eab308",
    minor: "#3b82f6",
  }[normalized];
}

export function formatRelative(date: Date): string {
  const diff = Date.now() - date.getTime();
  const min = 60_000;
  const hour = 60 * min;
  const day = 24 * hour;
  if (diff < hour) return `${Math.max(1, Math.round(diff / min))}m ago`;
  if (diff < day) return `${Math.round(diff / hour)}h ago`;
  if (diff < 14 * day) return `${Math.round(diff / day)}d ago`;
  return date.toLocaleDateString();
}
