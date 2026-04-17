import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { appUrl, priceIdFor, stripe } from "@/lib/stripe";

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
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe().customers.create({
        email: user.email,
        name: user.name ?? undefined,
        metadata: { userId: user.id },
      });
      customerId = customer.id;
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId },
      });
    }

    const checkout = await stripe().checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl()}/dashboard?upgraded=1`,
      cancel_url: `${appUrl()}/pricing?canceled=1`,
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      subscription_data: {
        metadata: { userId: user.id, plan: planParam },
      },
      client_reference_id: user.id,
    });

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
