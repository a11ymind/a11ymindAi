import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { safeAppRedirectPath } from "@/lib/redirects";
import { appUrl, stripe } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const requestUrl = new URL(req.url);
  const returnTo = safeAppRedirectPath(requestUrl.searchParams.get("returnTo"), "/dashboard");

  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.redirect(
      new URL(`/login?callbackUrl=${encodeURIComponent(returnTo)}`, req.url),
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { stripeCustomerId: true },
  });
  if (!user?.stripeCustomerId) {
    const u = new URL(returnTo, appUrl());
    u.searchParams.set("error", "no_subscription");
    return NextResponse.redirect(u);
  }

  try {
    const portal = await stripe().billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${appUrl()}${returnTo}`,
    });
    return NextResponse.redirect(portal.url, { status: 303 });
  } catch (e) {
    console.error("[stripe/portal] failed:", e);
    const u = new URL(returnTo, appUrl());
    u.searchParams.set("error", "portal_failed");
    return NextResponse.redirect(u);
  }
}
