import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { entitlementsFor } from "@/lib/entitlements";
import {
  executeScanRecord,
  isDueForAutoScan,
  reserveScheduledScan,
} from "@/lib/scan-jobs";
import { maybeSendScheduledScanAlert, type AlertOutcome } from "@/lib/scan-alert";
import { maybeSendWeeklyDigest, type DigestOutcome } from "@/lib/scan-digest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

type SiteResult =
  | { siteId: string; url: string; status: "skipped"; reason: string }
  | {
      siteId: string;
      url: string;
      status: "completed";
      scanId: string;
      score: number;
      alert: AlertOutcome;
    }
  | { siteId: string; url: string; status: "failed"; scanId: string; error: string };

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");

  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured" },
      { status: 503 },
    );
  }

  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startedAt = new Date();
  const sites = await prisma.site.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      url: true,
      user: { select: { plan: true } },
      scans: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { createdAt: true },
      },
    },
  });

  const dueSites = sites.filter((site) => {
    const cadence = entitlementsFor(site.user.plan).autoScan;
    return isDueForAutoScan(site.scans[0]?.createdAt, cadence, startedAt);
  });

  const results: SiteResult[] = [];

  for (const site of dueSites) {
    try {
      const reservation = await reserveScheduledScan({ siteId: site.id, now: startedAt });
      if (!reservation.ok) {
        results.push({
          siteId: site.id,
          url: site.url,
          status: "skipped",
          reason: reservation.reason,
        });
        continue;
      }

      const execution = await executeScanRecord(reservation.scan, reservation.plan);
      if (execution.ok) {
        let alert: AlertOutcome = {
          status: "skipped",
          reason: "not_attempted",
        };
        try {
          alert = await maybeSendScheduledScanAlert({
            siteId: site.id,
            currentScanId: execution.scanId,
            now: startedAt,
          });
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Unknown alert failure";
          console.error(`[cron] alert failure for site ${site.id}:`, error);
          alert = { status: "failed", error: message };
        }

        results.push({
          siteId: site.id,
          url: site.url,
          status: "completed",
          scanId: execution.scanId,
          score: execution.score,
          alert,
        });
      } else {
        results.push({
          siteId: site.id,
          url: site.url,
          status: "failed",
          scanId: execution.scanId,
          error: execution.error,
        });
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown scheduled scan failure";
      results.push({
        siteId: site.id,
        url: site.url,
        status: "skipped",
        reason: `unexpected_error:${message}`,
      });
    }
  }

  // Weekly digest pass — PRO users get a summary email roughly once a week
  // regardless of whether today's scheduled scan fired. Independent of the
  // regression-alert pass above; cooldowns keep it from double-sending.
  const digestResults: {
    siteId: string;
    url: string;
    outcome: DigestOutcome;
  }[] = [];
  const proSites = await prisma.site.findMany({
    where: { user: { plan: "PRO" } },
    select: { id: true, url: true },
  });
  for (const site of proSites) {
    try {
      const outcome = await maybeSendWeeklyDigest({
        siteId: site.id,
        now: startedAt,
      });
      digestResults.push({ siteId: site.id, url: site.url, outcome });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown digest failure";
      console.error(`[cron] digest failure for site ${site.id}:`, error);
      digestResults.push({
        siteId: site.id,
        url: site.url,
        outcome: { status: "failed", error: message },
      });
    }
  }

  const finishedAt = new Date();

  return NextResponse.json({
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    totalSites: sites.length,
    dueSites: dueSites.length,
    completed: results.filter((result) => result.status === "completed").length,
    failed: results.filter((result) => result.status === "failed").length,
    skipped: results.filter((result) => result.status === "skipped").length,
    alertsSent: results.filter(
      (result) => result.status === "completed" && result.alert.status === "sent",
    ).length,
    digestsSent: digestResults.filter((d) => d.outcome.status === "sent").length,
    results,
    digestResults,
  });
}
