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
    tagline: "See your accessibility risk in 60 seconds.",
    features: [
      { text: "5 scans / month", included: true },
      { text: "1 saved site", included: true },
      { text: "3 AI fix suggestions / month", included: true },
      { text: "Full WCAG 2.1 AA report", included: true },
      { text: "Auto re-scans", included: false },
      { text: "PDF report + shareable link", included: false },
      { text: "Public monitoring badge", included: false },
    ],
  },
  {
    id: "STARTER",
    name: "Starter",
    priceUsd: 19,
    priceIdEnv: "STRIPE_STARTER_PRICE_ID",
    tagline: "For one site you actually care about.",
    features: [
      { text: "Unlimited manual scans", included: true },
      { text: "1 saved site", included: true },
      { text: "Weekly auto-scan + email alerts", included: true },
      { text: "AI fix suggestions (100 / month)", included: true },
      { text: "PDF report + shareable link", included: true },
      { text: "Public monitoring badge", included: true },
    ],
    highlight: true,
  },
  {
    id: "PRO",
    name: "Pro",
    priceUsd: 49,
    priceIdEnv: "STRIPE_PRO_PRICE_ID",
    tagline: "Agencies and teams managing many sites.",
    features: [
      { text: "Everything in Starter", included: true },
      { text: "10 saved sites", included: true },
      { text: "Daily auto-scan", included: true },
      { text: "AI fix suggestions (500 / month)", included: true },
      { text: "Regression diffs across scans", included: true },
      { text: "Slack alerts", included: true },
      { text: "CI / GitHub Action integration", included: true },
    ],
  },
];

export function tierById(id: Plan): PlanTier {
  const tier = PLAN_TIERS.find((t) => t.id === id);
  if (!tier) throw new Error(`Unknown plan: ${id}`);
  return tier;
}
