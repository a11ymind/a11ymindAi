import type { Plan } from "@prisma/client";

export type PlanFeature = { text: string; included: boolean };

export type PlanTier = {
  id: Plan;
  name: string;
  priceUsd: number;
  /** Env-var name that should hold the Stripe price ID for this tier. */
  priceIdEnv: string | null;
  tagline: string;
  features: PlanFeature[];
  highlight?: boolean;
};

export const PLAN_TIERS: PlanTier[] = [
  {
    id: "FREE",
    name: "Free",
    priceUsd: 0,
    priceIdEnv: null,
    tagline: "Try Accessly with a single site.",
    features: [
      { text: "1 saved site", included: true },
      { text: "On-demand manual scans", included: true },
      { text: "Full WCAG 2.1 AA report", included: true },
      { text: "Monthly auto-scan", included: false },
      { text: "Email alerts", included: false },
      { text: "AI fix suggestions", included: false },
      { text: "PDF report", included: false },
    ],
  },
  {
    id: "STARTER",
    name: "Starter",
    priceUsd: 19,
    priceIdEnv: "STRIPE_STARTER_PRICE_ID",
    tagline: "Keep a single site audited automatically.",
    features: [
      { text: "1 saved site", included: true },
      { text: "Full WCAG 2.1 AA report", included: true },
      { text: "Monthly auto-scan", included: true },
      { text: "Email alerts on regressions", included: true },
      { text: "AI fix suggestions", included: false },
      { text: "PDF report", included: false },
    ],
  },
  {
    id: "PRO",
    name: "Pro",
    priceUsd: 49,
    priceIdEnv: "STRIPE_PRO_PRICE_ID",
    tagline: "Multi-site coverage with AI remediation.",
    features: [
      { text: "Up to 10 saved sites", included: true },
      { text: "Full WCAG 2.1 AA report", included: true },
      { text: "Weekly auto-scan", included: true },
      { text: "Email alerts on regressions", included: true },
      { text: "AI fix suggestions", included: true },
      { text: "Downloadable PDF report", included: true },
    ],
    highlight: true,
  },
];

export function tierById(id: Plan): PlanTier {
  const tier = PLAN_TIERS.find((t) => t.id === id);
  if (!tier) throw new Error(`Unknown plan: ${id}`);
  return tier;
}
