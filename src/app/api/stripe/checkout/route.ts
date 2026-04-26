import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimitUserAction } from "@/lib/rate-limit";
import { appUrl, isStripeMissingCustomerError, priceIdFor, stripe } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const planParam = url.searchParams.get("plan");
  if (planParam !== "STARTER" && planParam !== "PRO") {
    return redirectWithError("/pricing", "unknown_plan");
  }

  const session = await getSession();
  if (!session?.user?.id) {
    const callback = `/api/stripe/checkout?plan=${planParam}`;
    return NextResponse.redirect(
      new URL(`/login?callbackUrl=${encodeURIComponent(callback)}`, req.url),
    );
  }

  // Cap checkout-session creation: prevents Stripe-customer spam if a logged-in
  // attacker hammers this endpoint.
  const limit = await rateLimitUserAction({
    userId: session.user.id,
    action: "stripe_checkout",
    limit: 10,
    windowMs: 60 * 60 * 1000,
  });
  if (!limit.allowed) {
    return redirectWithError("/pricing", "rate_limited");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      plan: true,
      stripeCustomerId: true,
      stripeSubscriptionId: true,
    },
  });
  if (!user) return redirectWithError("/login", "no_user");
  if (user.plan === planParam) {
    return redirectWithError("/pricing", "already_on_plan");
  }
  if (user.stripeSubscriptionId) {
    const portalUrl = new URL("/api/stripe/portal", req.url);
    portalUrl.searchParams.set("returnTo", "/pricing");
    return NextResponse.redirect(portalUrl, { status: 303 });
  }

  let priceId: string;
  try {
    priceId = priceIdFor(planParam);
  } catch (e) {
    console.error("[stripe/checkout] price id not configured:", (e as Error).message);
    return redirectWithError("/pricing", "price_not_configured");
  }

  try {
    let customerId = user.stripeCustomerId ?? (await createStripeCustomer(user));
    let checkout;
    try {
      checkout = await createCheckoutSession({
        customerId,
        priceId,
        userId: user.id,
        plan: planParam,
      });
    } catch (e) {
      if (!user.stripeCustomerId || !isStripeMissingCustomerError(e)) {
        throw e;
      }

      console.warn(
        `[stripe/checkout] stale customer id ${user.stripeCustomerId} for user ${user.id}; recreating`,
      );
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: null },
      });
      customerId = await createStripeCustomer(user);
      checkout = await createCheckoutSession({
        customerId,
        priceId,
        userId: user.id,
        plan: planParam,
      });
    }

    if (!checkout.url) {
      return redirectWithError("/pricing", "checkout_no_url");
    }
    return NextResponse.redirect(checkout.url, { status: 303 });
  } catch (e) {
    console.error("[stripe/checkout] failed:", e);
    return redirectWithError("/pricing", "checkout_failed");
  }
}

function redirectWithError(path: string, code: string) {
  const u = new URL(path, appUrl());
  u.searchParams.set("error", code);
  return NextResponse.redirect(u);
}

async function createStripeCustomer(user: {
  id: string;
  email: string;
  name: string | null;
}) {
  const customer = await stripe().customers.create({
    email: user.email,
    name: user.name ?? undefined,
    metadata: { userId: user.id },
  });
  await prisma.user.update({
    where: { id: user.id },
    data: { stripeCustomerId: customer.id },
  });
  return customer.id;
}

async function createCheckoutSession(input: {
  customerId: string;
  priceId: string;
  userId: string;
  plan: "STARTER" | "PRO";
}) {
  return stripe().checkout.sessions.create({
    mode: "subscription",
    customer: input.customerId,
    line_items: [{ price: input.priceId, quantity: 1 }],
    success_url: `${appUrl()}/dashboard?upgraded=1`,
    cancel_url: `${appUrl()}/pricing?canceled=1`,
    allow_promotion_codes: true,
    billing_address_collection: "auto",
    subscription_data: {
      metadata: { userId: input.userId, plan: input.plan },
    },
    client_reference_id: input.userId,
  });
}
