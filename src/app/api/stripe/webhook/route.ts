import { NextResponse } from "next/server";
import { headers } from "next/headers";
import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { planForPriceId, stripe } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Stripe sends JSON but we need the raw body for signature verification.
// App-Router routes hand us the raw body via `req.text()`.
export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[stripe/webhook] STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "webhook not configured" }, { status: 500 });
  }

  const body = await req.text();
  const sig = (await headers()).get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "missing stripe-signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(body, sig, secret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "invalid signature";
    console.error("[stripe/webhook] signature verification failed:", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        // We may get here before the subscription events fire — sync immediately
        // so the user sees the upgrade without waiting for the next event.
        if (session.subscription && session.customer) {
          const sub = await stripe().subscriptions.retrieve(
            session.subscription as string,
          );
          await applySubscription(sub);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        await applySubscription(sub);
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await clearSubscription(sub);
        break;
      }
      default:
        // Acknowledge unhandled events so Stripe stops retrying.
        break;
    }
  } catch (err) {
    console.error("[stripe/webhook] handler error:", err);
    // Return 500 so Stripe retries — transient DB errors will recover.
    return NextResponse.json({ error: "handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function applySubscription(sub: Stripe.Subscription) {
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const priceId = sub.items.data[0]?.price.id;
  if (!priceId) {
    console.warn(
      `[stripe/webhook] missing price id on subscription ${sub.id}; skipping update`,
    );
    return;
  }

  const plan = planForPriceId(priceId);
  if (!plan) {
    console.warn(
      `[stripe/webhook] unknown price id ${priceId} on subscription ${sub.id}`,
    );
    return;
  }

  const active =
    sub.status === "active" ||
    sub.status === "trialing" ||
    sub.status === "past_due"; // grace period — keep them on their plan

  // `current_period_end` is in seconds; the field is guaranteed present on
  // active subscriptions.
  const periodEndSec = sub.current_period_end;
  const periodEnd = active && periodEndSec ? new Date(periodEndSec * 1000) : null;

  const result = await prisma.user.updateMany({
    where: { stripeCustomerId: customerId },
    data: {
      plan: active ? plan : "FREE",
      stripeSubscriptionId: active ? sub.id : null,
      stripePriceId: active ? priceId : null,
      stripeCurrentPeriodEnd: active ? periodEnd : null,
    },
  });
  if (result.count === 0) {
    console.warn(`[stripe/webhook] no user found for customer ${customerId}`);
  }
}

async function clearSubscription(sub: Stripe.Subscription) {
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const result = await prisma.user.updateMany({
    where: { stripeCustomerId: customerId },
    data: {
      plan: "FREE",
      stripeSubscriptionId: null,
      stripePriceId: null,
      stripeCurrentPeriodEnd: null,
    },
  });
  if (result.count === 0) {
    console.warn(`[stripe/webhook] no user found for customer ${customerId}`);
  }
}
