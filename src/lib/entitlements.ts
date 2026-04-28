import type { Plan } from "@prisma/client";

export type AutoScan = "none" | "monthly" | "weekly" | "daily";

export type Entitlements = {
  maxProjects: number;
  maxPagesPerProject: number;
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
  teamMembers: boolean;
  maxWorkspaceMembers: number;
};

export const ENTITLEMENTS: Record<Plan, Entitlements> = {
  FREE: {
    maxProjects: 1,
    maxPagesPerProject: 1,
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
    teamMembers: false,
    maxWorkspaceMembers: 1,
  },
  STARTER: {
    maxProjects: 1,
    maxPagesPerProject: 25,
    maxSites: 25,
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
    teamMembers: false,
    maxWorkspaceMembers: 1,
  },
  PRO: {
    maxProjects: 5,
    maxPagesPerProject: 100,
    maxSites: 500,
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
    teamMembers: true,
    maxWorkspaceMembers: 10,
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
  const { maxProjects, maxPagesPerProject } = entitlementsFor(plan);
  if (plan === "PRO") {
    return `You've reached the Pro limit of ${maxProjects} websites with ${maxPagesPerProject} pages each.`;
  }
  if (maxPagesPerProject === 1) {
    return `Your ${planLabel(plan)} plan allows 1 monitored page. Upgrade to monitor full websites.`;
  }
  return `Your ${planLabel(plan)} plan allows ${maxProjects} website with up to ${maxPagesPerProject} pages. Upgrade to monitor more.`;
}

export function autoScanLabel(value: AutoScan): string {
  if (value === "daily") return "Daily";
  if (value === "weekly") return "Weekly";
  if (value === "monthly") return "Monthly";
  return "Not included";
}
