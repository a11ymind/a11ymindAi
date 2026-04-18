import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { normalizeUrl } from "@/lib/scan";
import {
  rateLimitAnonymousScan,
  rateLimitAuthenticatedScan,
  rateLimitHeaders,
} from "@/lib/rate-limit";
import {
  createScanRecord,
  executeScanRecord,
  reapStaleRunningScans,
} from "@/lib/scan-jobs";
import { entitlementsFor } from "@/lib/entitlements";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const Body = z.object({
  url: z.string().trim().min(1).max(2048, "URL is too long"),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = Body.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  let target: string;
  try {
    target = normalizeUrl(parsed.data.url);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }

  const session = await getSession();
  const userId = session?.user?.id ?? null;
  let siteId: string | null = null;
  let userPlan: "FREE" | "STARTER" | "PRO" | null = null;

  if (!userId) {
    const rateLimit = await rateLimitAnonymousScan(req);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          code: "RATE_LIMITED",
          error:
            "You've reached the anonymous scan limit for now. Please try again later.",
          message:
            "You've reached the anonymous scan limit for now. Please try again later or create an account to keep tracking sites from your dashboard.",
          aiEnabled: false,
          aiUsageCurrent: 0,
          aiUsageLimit: null,
          aiUsageRemaining: null,
          aiLimitReached: false,
          requiresLoginForAI: true,
          requiresUpgradeForAI: false,
          retryAfterSec: rateLimit.retryAfterSec,
          limit: rateLimit.limit,
          windowMs: rateLimit.windowMs,
        },
        {
          status: 429,
          headers: rateLimitHeaders(rateLimit),
        },
      );
    }
  }

  if (userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true },
    });
    userPlan = user?.plan ?? "FREE";

    // Release any of this user's prior scans that got stuck in RUNNING.
    // Protects the AI reservation slot + gives an accurate in-flight count.
    await reapStaleRunningScans(userId);

    const monthlyLimit = entitlementsFor(userPlan).monthlyScanLimit;
    if (monthlyLimit !== null) {
      const monthStart = new Date();
      monthStart.setUTCDate(1);
      monthStart.setUTCHours(0, 0, 0, 0);
      const used = await prisma.scan.count({
        where: { userId, createdAt: { gte: monthStart } },
      });
      if (used >= monthlyLimit) {
        return NextResponse.json(
          {
            code: "MONTHLY_LIMIT_REACHED",
            error: `You've used all ${monthlyLimit} scans on the Free plan this month.`,
            message: `You've used all ${monthlyLimit} scans on the Free plan this month. Upgrade to Starter for unlimited manual scans.`,
            plan: userPlan,
            limit: monthlyLimit,
            used,
          },
          { status: 429 },
        );
      }
    }

    const authLimit = await rateLimitAuthenticatedScan(userId, userPlan);
    if (!authLimit.allowed) {
      return NextResponse.json(
        {
          code: "RATE_LIMITED",
          error: "You've reached your daily scan limit on this plan.",
          message:
            "You've reached your daily scan limit on this plan. It resets in 24 hours, or upgrade for more headroom.",
          plan: userPlan,
          limit: authLimit.limit,
          retryAfterSec: authLimit.retryAfterSec,
          windowMs: authLimit.windowMs,
        },
        {
          status: 429,
          headers: rateLimitHeaders(authLimit),
        },
      );
    }

    const existing = await prisma.site.findUnique({
      where: { userId_url: { userId, url: target } },
      select: { id: true },
    });

    if (existing) {
      siteId = existing.id;
    }
  }

  const scan = await createScanRecord({ url: target, userId, siteId });
  const result = await executeScanRecord(scan, userPlan);

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, scanId: result.scanId },
      { status: 500 },
    );
  }

  return NextResponse.json({
    scanId: result.scanId,
    score: result.score,
    ...result.ai,
  });
}
