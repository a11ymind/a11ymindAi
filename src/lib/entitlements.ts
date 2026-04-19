import type { Plan } from "@prisma/client";

export type AutoScan = "none" | "monthly" | "weekly" | "daily";

export type Entitlements = {
  maxSites: number;
  monthlyScanLimit: number | null;
  aiFixes: boolean;
  aiMonthlyLimit: number | null;
  pdfExport: boolean;
  shareableLink: boolean;
  autoScan: AutoScan;
  monitoringBadge: boolean;
  regressionDiffs: boolean;
  slackAlerts: boolean;
  ciIntegration: boolean;
};

export const ENTITLEMENTS: Record<Plan, Entitlements> = {
  FREE: {
    maxSites: 1,
    monthlyScanLimit: 5,
    aiFixes: true,
    aiMonthlyLimit: 3,
    pdfExport: false,
    shareableLink: false,
    autoScan: "none",
    monitoringBadge: false,
    regressionDiffs: false,
    slackAlerts: false,
    ciIntegration: false,
  },
  STARTER: {
    maxSites: 5,
    monthlyScanLimit: null,
    aiFixes: true,
    aiMonthlyLimit: 100,
    pdfExport: true,
    shareableLink: true,
    autoScan: "weekly",
    monitoringBadge: true,
    regressionDiffs: false,
    slackAlerts: false,
    ciIntegration: false,
  },
  PRO: {
    maxSites: 25,
    monthlyScanLimit: null,
    aiFixes: true,
    aiMonthlyLimit: 500,
    pdfExport: true,
    shareableLink: true,
    autoScan: "daily",
    monitoringBadge: true,
    regressionDiffs: true,
    slackAlerts: true,
    ciIntegration: true,
  },
};

export function entitlementsFor(plan: Plan): Entitlements {
  return ENTITLEMENTS[plan];
}

export function planLabel(plan: Plan): string {
  return plan === "STARTER" ? "Starter" : plan === "PRO" ? "Pro" : "Free";
}

export function isAtSiteLimit(plan: Plan, siteCount: number): boolean {
  return siteCount >= entitlementsFor(plan).maxSites;
}

export function savedSiteLimitMessage(plan: Plan): string {
  const { maxSites } = entitlementsFor(plan);
  if (plan === "PRO") {
    return `You've reached the ${maxSites}-page limit.`;
  }
  return `Your ${planLabel(plan)} plan allows ${maxSites} saved page${maxSites === 1 ? "" : "s"}. Upgrade to monitor more.`;
}

export function autoScanLabel(value: AutoScan): string {
  if (value === "daily") return "Daily";
  if (value === "weekly") return "Weekly";
  if (value === "monthly") return "Monthly";
  return "Not included";
}
