import Stripe from "stripe";
import type { Plan } from "@prisma/client";

// Instantiate lazily so routes that don't need Stripe don't crash on import
// when the key is missing in dev.
let _stripe: Stripe | null = null;
export function stripe(): Stripe {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "STRIPE_SECRET_KEY is not set. See README > Setting up Stripe.",
    );
  }
  _stripe = new Stripe(key, {
    // Pin an API version. Update deliberately when Stripe releases breaking changes.
    apiVersion: "2025-03-31.basil" as Stripe.LatestApiVersion,
    typescript: true,
  });
  return _stripe;
}

// ---------------------------------------------------------------------------
// Price ID <-> Plan mapping
//
// ⚠️  Replace the placeholder values in .env (and production env) with real
// Stripe price IDs. The expected format is `price_XXXXXXXXXXXX`.
// See README > "Setting up Stripe" for step-by-step instructions.
// ---------------------------------------------------------------------------
const PLACEHOLDER_PREFIX = "price_REPLACE_ME";

export function priceIdFor(plan: Exclude<Plan, "FREE">): string {
  const env = plan === "STARTER" ? "STRIPE_STARTER_PRICE_ID" : "STRIPE_PRO_PRICE_ID";
  const val = process.env[env];
  if (!val || val.startsWith(PLACEHOLDER_PREFIX)) {
    throw new Error(
      `${env} is not configured. See README > Setting up Stripe for how to create prices via the Stripe CLI.`,
    );
  }
  return val;
}

export function planForPriceId(priceId: string | null | undefined): Plan | null {
  if (!priceId) return null;
  if (priceId === process.env.STRIPE_STARTER_PRICE_ID) return "STARTER";
  if (priceId === process.env.STRIPE_PRO_PRICE_ID) return "PRO";
  return null;
}

export function appUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    "http://localhost:3000"
  );
}
