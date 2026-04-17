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
    tagline: "Scan any page, then decide what to monitor.",
    features: [
      { text: "Scan any page", included: true },
      { text: "Monitor 1 website", included: true },
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
    tagline: "Scan any page and monitor one website automatically.",
    features: [
      { text: "Scan any page", included: true },
      { text: "Monitor 1 website", included: true },
      { text: "Full WCAG 2.1 AA report", included: true },
      { text: "Monthly auto-scan", included: true },
      { text: "Email alerts on regressions", included: true },
      { text: "AI fix suggestions (20 scans / month)", included: true },
      { text: "PDF report", included: false },
    ],
  },
  {
    id: "PRO",
    name: "Pro",
    priceUsd: 49,
    priceIdEnv: "STRIPE_PRO_PRICE_ID",
    tagline: "Scan any page and monitor multiple websites with AI remediation.",
    features: [
      { text: "Scan any page", included: true },
      { text: "Monitor up to 10 websites", included: true },
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
