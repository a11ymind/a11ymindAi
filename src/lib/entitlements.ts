import type { Plan } from "@prisma/client";

export type AutoScan = "none" | "monthly" | "weekly";

export type Entitlements = {
  maxSites: number;
  aiFixes: boolean;
  aiMonthlyLimit: number | null;
  pdfExport: boolean;
  autoScan: AutoScan;
  monitoringBadge: boolean;
};

export const ENTITLEMENTS: Record<Plan, Entitlements> = {
  FREE: {
    maxSites: 1,
    aiFixes: false,
    aiMonthlyLimit: null,
    pdfExport: false,
    autoScan: "none",
    monitoringBadge: false,
  },
  STARTER: {
    maxSites: 1,
    aiFixes: true,
    aiMonthlyLimit: 20,
    pdfExport: false,
    autoScan: "monthly",
    monitoringBadge: true,
  },
  PRO: {
    maxSites: 10,
    aiFixes: true,
    aiMonthlyLimit: 200,
    pdfExport: true,
    autoScan: "weekly",
    monitoringBadge: true,
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
    return `You've reached the ${maxSites}-site limit.`;
  }
  return `Your ${planLabel(plan)} plan allows ${maxSites} saved site${maxSites === 1 ? "" : "s"}. Upgrade to track more.`;
}

export function autoScanLabel(value: AutoScan): string {
  return value === "weekly" ? "Weekly" : value === "monthly" ? "Monthly" : "Not included";
}
