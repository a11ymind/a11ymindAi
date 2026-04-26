import { after, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import {
  extractClientIp,
  rateLimitAnonymousScan,
  rateLimitAuthenticatedScan,
  rateLimitHeaders,
  rateLimitUserAction,
} from "@/lib/rate-limit";
import { entitlementsFor } from "@/lib/entitlements";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const Body = z.object({
  url: z.string().trim().min(1).max(2048, "URL is too long"),
});

export async function POST(req: Request) {
  try {
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
      const { normalizeUrl } = await import("@/lib/scan");
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
              "You've reached the anonymous scan limit for now. Please try again later or create an account to keep tracking pages from your dashboard.",
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
      const { reapStaleRunningScans } = await import("@/lib/scan-jobs");
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { plan: true },
      });
      userPlan = user?.plan ?? "FREE";

      // Release any of this user's prior scans that got stuck before finishing.
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

      // Cap concurrent in-flight scans per user. Prevents someone firing 50
      // parallel requests to bypass monthly/daily caps before any complete.
      const concurrencyCap =
        userPlan === "PRO" ? 5 : userPlan === "STARTER" ? 2 : 1;
      const inFlight = await prisma.scan.count({
        where: { userId, status: { in: ["PENDING", "RUNNING"] } },
      });
      if (inFlight >= concurrencyCap) {
        return NextResponse.json(
          {
            code: "TOO_MANY_INFLIGHT",
            error: `You already have ${inFlight} scan${inFlight === 1 ? "" : "s"} running.`,
            message: `You already have ${inFlight} scan${inFlight === 1 ? "" : "s"} running. Wait for those to finish before starting another.`,
            plan: userPlan,
            limit: concurrencyCap,
          },
          { status: 429 },
        );
      }

      // Per-IP authenticated-scan cap. Stops bulk-farmed accounts that share
      // a single IP from each spending their per-user quota — they share the
      // IP budget instead. Legit office networks have plenty of headroom.
      const clientIp = extractClientIp(req);
      if (clientIp) {
        const ipLimit = await rateLimitUserAction({
          userId: `ip:${clientIp}`,
          action: "auth-scan-ip",
          limit: 40,
          windowMs: 24 * 60 * 60 * 1000,
        });
        if (!ipLimit.allowed) {
          return NextResponse.json(
            {
              code: "RATE_LIMITED",
              error:
                "Too many scans from this network today. Try again in 24 hours.",
              message:
                "Too many scans have been run from this network today. If you're on a shared office or VPN, try again in a few hours or contact support.",
              retryAfterSec: ipLimit.retryAfterSec,
            },
            { status: 429, headers: rateLimitHeaders(ipLimit) },
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
      } else {
        // Auto-create a Site so the scan appears on the dashboard.
        // Only do this when the user is within their plan's site limit.
        const { isAtSiteLimit } = await import("@/lib/entitlements");
        const siteCount = await prisma.site.count({ where: { userId } });
        if (!isAtSiteLimit(userPlan, siteCount)) {
          const created = await prisma.site.create({
            data: { userId, url: target },
            select: { id: true },
          });
          siteId = created.id;
        }
      }
    }

    const { createScanRecord } = await import("@/lib/scan-jobs");
    const { ensureProjectPageForUrl } = await import("@/lib/projects");
    const projectPage = await ensureProjectPageForUrl({ userId, url: target });
    if (projectPage && siteId) {
      await prisma.site.updateMany({
        where: { id: siteId, userId: userId ?? undefined },
        data: {
          projectId: projectPage.projectId,
          pageId: projectPage.pageId,
        },
      });
    }
    const scan = await createScanRecord({
      url: target,
      userId,
      siteId,
      projectId: projectPage?.projectId ?? null,
      pageId: projectPage?.pageId ?? null,
    });
    enqueueScanWorker(scan.id, req.url);

    return NextResponse.json({
      scanId: scan.id,
      status: "PENDING",
    });
  } catch (error) {
    console.error("[api/scan] unexpected error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unexpected scan failure",
      },
      { status: 500 },
    );
  }
}

function enqueueScanWorker(scanId: string, requestUrl: string) {
  const secret = process.env.SCAN_WORKER_SECRET;
  if (!secret) {
    console.warn("[api/scan] SCAN_WORKER_SECRET missing; client fallback will start scan");
    return;
  }

  const baseUrl = workerBaseUrl(requestUrl);
  after(async () => {
    try {
      const res = await fetch(`${baseUrl}/api/internal/scan-worker`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${secret}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({ scanId }),
        cache: "no-store",
      });

      if (!res.ok) {
        console.error(
          `[api/scan] scan worker returned ${res.status} for ${scanId}`,
        );
      }
    } catch (error) {
      console.error(`[api/scan] failed to enqueue scan worker for ${scanId}:`, error);
    }
  });
}

function workerBaseUrl(requestUrl: string) {
  const configured =
    process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? null;
  if (configured) return configured.replace(/\/$/, "");
  const parsed = new URL(requestUrl);
  return parsed.origin;
}
