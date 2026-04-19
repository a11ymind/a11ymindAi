import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { entitlementsFor } from "@/lib/entitlements";
import { normalizeSlackWebhookUrl } from "@/lib/slack";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  webhookUrl: z.string().trim().max(1000).optional().default(""),
});

export async function POST(
  req: Request,
  { params }: { params: { siteId: string } },
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid input" },
      { status: 400 },
    );
  }

  const site = await prisma.site.findUnique({
    where: { id: params.siteId },
    select: {
      id: true,
      userId: true,
      user: { select: { plan: true } },
    },
  });
  if (!site || site.userId !== session.user.id) {
    return NextResponse.json({ error: "Site not found" }, { status: 404 });
  }

  const rawWebhook = parsed.data.webhookUrl;
  if (!rawWebhook) {
    await prisma.site.update({
      where: { id: site.id },
      data: { slackWebhookUrl: null },
    });
    return NextResponse.json({ ok: true, configured: false });
  }

  if (!entitlementsFor(site.user.plan).slackAlerts) {
    return NextResponse.json(
      { error: "Slack alerts are available on Pro." },
      { status: 403 },
    );
  }

  const webhookUrl = normalizeSlackWebhookUrl(rawWebhook);
  if (!webhookUrl) {
    return NextResponse.json(
      {
        error:
          "Enter a valid Slack incoming webhook URL from hooks.slack.com or hooks.slack-gov.com.",
      },
      { status: 400 },
    );
  }

  await prisma.site.update({
    where: { id: site.id },
    data: { slackWebhookUrl: webhookUrl },
  });

  return NextResponse.json({ ok: true, configured: true });
}
