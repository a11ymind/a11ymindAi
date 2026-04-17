import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { planForPriceId, stripe } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Webhook-independent billing sync. Called after a successful Checkout
// redirect so the UI doesn't have to wait for `checkout.session.completed`
// to arrive asynchronously.
export async function POST() {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, stripeCustomerId: true },
  });
  if (!user?.stripeCustomerId) {
    return NextResponse.json({ ok: true, synced: false });
  }

  try {
    const subs = await stripe().subscriptions.list({
      customer: user.stripeCustomerId,
      status: "all",
      limit: 5,
      expand: ["data.items.data.price"],
    });

    // Prefer the most recently-created active/trialing/past_due subscription.
    const liveStatuses: Stripe.Subscription.Status[] = [
      "active",
      "trialing",
      "past_due",
    ];
    const live = subs.data
      .filter((s) => liveStatuses.includes(s.status))
      .sort((a, b) => b.created - a.created)[0];

    if (live) {
      const priceId = live.items.data[0]?.price.id;
      const plan = planForPriceId(priceId);
      const periodEndSec = (live as Stripe.Subscription & {
        current_period_end?: number;
      }).current_period_end;
      const periodEnd = periodEndSec ? new Date(periodEndSec * 1000) : null;

      await prisma.user.update({
        where: { id: user.id },
        data: {
          plan: plan ?? "FREE",
          stripeSubscriptionId: live.id,
          stripePriceId: priceId ?? null,
          stripeCurrentPeriodEnd: periodEnd,
        },
      });
      return NextResponse.json({ ok: true, synced: true, plan: plan ?? "FREE" });
    }

    // No live subscription — make sure we don't leave a stale plan on the user.
    await prisma.user.update({
      where: { id: user.id },
      data: {
        plan: "FREE",
        stripeSubscriptionId: null,
        stripePriceId: null,
        stripeCurrentPeriodEnd: null,
      },
    });
    return NextResponse.json({ ok: true, synced: true, plan: "FREE" });
  } catch (e) {
    console.error("[stripe/sync] failed:", e);
    return NextResponse.json({ error: "sync_failed" }, { status: 500 });
  }
}
