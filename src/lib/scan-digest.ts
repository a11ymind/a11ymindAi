import { prisma } from "@/lib/prisma";
import { sendWeeklyDigestEmail } from "@/lib/email";

const DIGEST_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const DIGEST_COOLDOWN_MS = 6 * 24 * 60 * 60 * 1000 + 12 * 60 * 60 * 1000; // ~6.5d

export type DigestOutcome =
  | { status: "sent"; emailId: string | null }
  | { status: "skipped"; reason: string }
  | { status: "failed"; error: string };

// Sends a weekly summary for one site. Called from the daily cron after the
// scheduled-scan pass. Gated by a per-site cooldown so the daily cron only
// emits a digest roughly once every 7 days per site.
export async function maybeSendWeeklyDigest(input: {
  siteId: string;
  now?: Date;
  reportBaseUrl?: string;
}): Promise<DigestOutcome> {
  const now = input.now ?? new Date();
  const baseUrl =
    input.reportBaseUrl ??
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.APP_URL ??
    "";

  const site = await prisma.site.findUnique({
    where: { id: input.siteId },
    select: {
      id: true,
      url: true,
      lastDigestSentAt: true,
      user: { select: { email: true, plan: true } },
    },
  });
  if (!site) return { status: "skipped", reason: "site_missing" };
  if (site.user.plan !== "PRO") {
    return { status: "skipped", reason: "plan_ineligible" };
  }
  if (!site.user.email) return { status: "skipped", reason: "no_email" };

  if (
    site.lastDigestSentAt &&
    now.getTime() - site.lastDigestSentAt.getTime() < DIGEST_COOLDOWN_MS
  ) {
    return { status: "skipped", reason: "cooldown" };
  }

  const windowStart = new Date(now.getTime() - DIGEST_WINDOW_MS);
  const scansThisWeek = await prisma.scan.findMany({
    where: {
      siteId: site.id,
      status: "COMPLETED",
      createdAt: { gte: windowStart },
    },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      score: true,
      createdAt: true,
      violations: { select: { axeId: true } },
    },
  });

  if (scansThisWeek.length === 0) {
    return { status: "skipped", reason: "no_scans_this_week" };
  }

  const latestScan = scansThisWeek[scansThisWeek.length - 1];
  const firstScan = scansThisWeek[0];
  const scores = scansThisWeek.map((s) => s.score);
  const bestScore = Math.max(...scores);
  const worstScore = Math.min(...scores);

  const firstSet = new Set(firstScan.violations.map((v) => v.axeId));
  const latestSet = new Set(latestScan.violations.map((v) => v.axeId));
  const newIssues = [...latestSet].filter((id) => !firstSet.has(id)).length;
  const fixedIssues = [...firstSet].filter((id) => !latestSet.has(id)).length;

  const reportUrl = `${baseUrl.replace(/\/$/, "")}/scan/${latestScan.id}`;

  try {
    const result = await sendWeeklyDigestEmail({
      to: site.user.email,
      siteUrl: site.url,
      scanCount: scansThisWeek.length,
      latestScore: latestScan.score,
      bestScore,
      worstScore,
      newIssues,
      fixedIssues,
      reportUrl,
    });

    if (!result.ok) {
      console.error(
        `[scan-digest] send failed for site ${site.id}: ${result.error}`,
      );
      return { status: "failed", error: result.error };
    }

    await prisma.site.update({
      where: { id: site.id },
      data: { lastDigestSentAt: now },
    });

    return { status: "sent", emailId: result.id };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown digest failure";
    console.error(`[scan-digest] unexpected failure for site ${site.id}:`, error);
    return { status: "failed", error: message };
  }
}
