import { prisma } from "@/lib/prisma";
import { sendScheduledScanAlertEmail } from "@/lib/email";

// Minimum interval between scheduled-scan alerts for the same site. Weekly/
// monthly cadence already gates this, but we add a belt-and-braces cooldown
// so cron re-runs or manual triggers can't double-email.
const ALERT_COOLDOWN_MS = 23 * 60 * 60 * 1000;

export type AlertOutcome =
  | { status: "sent"; emailId: string | null }
  | { status: "skipped"; reason: string }
  | { status: "failed"; error: string };

export async function maybeSendScheduledScanAlert(input: {
  siteId: string;
  currentScanId: string;
  now?: Date;
  reportBaseUrl?: string;
}): Promise<AlertOutcome> {
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
      lastAlertSentAt: true,
      user: { select: { email: true, plan: true } },
    },
  });
  if (!site) return { status: "skipped", reason: "site_missing" };
  if (site.user.plan === "FREE") {
    return { status: "skipped", reason: "plan_ineligible" };
  }
  if (!site.user.email) return { status: "skipped", reason: "no_email" };

  if (
    site.lastAlertSentAt &&
    now.getTime() - site.lastAlertSentAt.getTime() < ALERT_COOLDOWN_MS
  ) {
    return { status: "skipped", reason: "cooldown" };
  }

  const [currentScan, previousScan] = await Promise.all([
    prisma.scan.findUnique({
      where: { id: input.currentScanId },
      select: {
        id: true,
        score: true,
        violations: { select: { axeId: true } },
      },
    }),
    prisma.scan.findFirst({
      where: {
        siteId: site.id,
        status: "COMPLETED",
        id: { not: input.currentScanId },
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        score: true,
        violations: { select: { axeId: true } },
      },
    }),
  ]);

  if (!currentScan) return { status: "skipped", reason: "current_scan_missing" };

  const currentSet = new Set(currentScan.violations.map((v) => v.axeId));
  const previousSet = new Set(
    (previousScan?.violations ?? []).map((v) => v.axeId),
  );
  const newIssues = [...currentSet].filter((id) => !previousSet.has(id)).length;
  const fixedIssues = [...previousSet].filter((id) => !currentSet.has(id))
    .length;
  const previousScore = previousScan?.score ?? null;
  const scoreDropped =
    previousScore !== null && currentScan.score < previousScore;

  if (newIssues === 0 && !scoreDropped) {
    return { status: "skipped", reason: "no_meaningful_change" };
  }

  const reportUrl = `${baseUrl.replace(/\/$/, "")}/scan/${currentScan.id}`;

  try {
    const result = await sendScheduledScanAlertEmail({
      to: site.user.email,
      siteUrl: site.url,
      previousScore,
      currentScore: currentScan.score,
      newIssues,
      fixedIssues,
      reportUrl,
    });

    if (!result.ok) {
      console.error(
        `[scan-alert] send failed for site ${site.id}: ${result.error}`,
      );
      return { status: "failed", error: result.error };
    }

    await prisma.site.update({
      where: { id: site.id },
      data: {
        lastAlertSentAt: now,
        lastAlertScanId: currentScan.id,
      },
    });

    return { status: "sent", emailId: result.id };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown alert failure";
    console.error(`[scan-alert] unexpected failure for site ${site.id}:`, error);
    return { status: "failed", error: message };
  }
}
