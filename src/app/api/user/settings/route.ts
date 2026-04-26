import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const patchSchema = z.object({
  name: z.string().trim().max(100).optional(),
  emailWeeklyDigest: z.boolean().optional(),
  emailScanAlerts: z.boolean().optional(),
});

export async function PATCH(request: Request): Promise<NextResponse> {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid input" },
      { status: 400 },
    );
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { ...parsed.data },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(): Promise<NextResponse> {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { stripeSubscriptionId: true },
  });

  if (user?.stripeSubscriptionId && process.env.STRIPE_SECRET_KEY) {
    try {
      await stripe().subscriptions.cancel(user.stripeSubscriptionId);
    } catch {
      // Subscription may already be cancelled or unreachable; proceed with deletion.
    }
  }

  await prisma.user.delete({ where: { id: session.user.id } });

  return NextResponse.json({ ok: true });
}
