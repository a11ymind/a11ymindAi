import Link from "next/link";
import { redirect } from "next/navigation";
import { BadgeEmbedCard } from "@/components/BadgeEmbedCard";
import { BillingStateRefresh } from "@/components/BillingStateRefresh";
import { CiHistoryCard } from "@/components/CiHistoryCard";
import { Logo } from "@/components/Logo";
import { PlanBadge } from "@/components/PlanBadge";
import { SignOutButton } from "@/components/UserMenu";
import { RescanButton } from "@/components/RescanButton";
import { SlackWebhookCard } from "@/components/SlackWebhookCard";
import { URLScanner } from "@/components/URLScanner";
import {
  ScoreHistoryChart,
  type ChartPoint,
  type ChartSeries,
} from "@/components/ScoreHistoryChart";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { scoreBand } from "@/lib/score";
import { buildRegressionDiff } from "@/lib/scan-diff";
import {
  autoScanLabel,
  entitlementsFor,
  isAtSiteLimit,
} from "@/lib/entitlements";
import { getAiUsageSummary } from "@/lib/ai-usage";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dashboard — a11ymind AI" };

const SERIES_COLORS = [
  "#06b6d4",
  "#a78bfa",
  "#f59e0b",
  "#22c55e",
  "#ec4899",
  "#3b82f6",
  "#f97316",
  "#10b981",
  "#8b5cf6",
  "#ef4444",
];

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: { upgraded?: string; error?: string };
}) {
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, name: true, plan: true },
  });
  if (!user) redirect("/login");

  const sites = await prisma.site.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      url: true,
      ciIngestToken: true,
      slackWebhookUrl: true,
      scans: {
        where: { status: "COMPLETED" },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          score: true,
          createdAt: true,
          violations: { select: { axeId: true } },
        },
      },
      ciChecks: {
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          source: true,
          status: true,
          score: true,
          criticalCount: true,
          seriousCount: true,
          moderateCount: true,
          minorCount: true,
          branch: true,
          commitSha: true,
          environment: true,
          runUrl: true,
          reportUrl: true,
          createdAt: true,
        },
      },
    },
  });

  const series: ChartSeries[] = sites.map((s, i) => ({
    key: s.id,
    label: hostOf(s.url),
    color: SERIES_COLORS[i % SERIES_COLORS.length],
  }));

  const chartData = buildChartData(sites);
  const weekly = await buildWeeklySummary(session.user.id);
  const entitlements = entitlementsFor(user.plan);
  const atSiteLimit = isAtSiteLimit(user.plan, sites.length);
  const baseUrl = normalizeBaseUrl(
    process.env.NEXT_PUBLIC_APP_URL ??
      process.env.NEXTAUTH_URL ??
      "http://localhost:3000",
  );
  const scanCadence =
    entitlements.autoScan === "none" ? "Manual only" : autoScanLabel(entitlements.autoScan);
  const aiUsage = await getAiUsageSummary(session.user.id, user.plan);
  const aiFixesValue = entitlements.aiFixes
    ? aiUsage.aiUsageLimit === null
      ? "Unlimited"
      : `${aiUsage.aiUsageCurrent} / ${aiUsage.aiUsageLimit}`
    : "Locked";
  const aiFixesDetail = entitlements.aiFixes
    ? aiUsage.aiUsageLimit === null
      ? "AI remediation guidance on every saved scan"
      : aiUsage.aiLimitReached
        ? `Monthly cap reached — upgrade for more`
        : `${aiUsage.aiUsageRemaining} AI fix${aiUsage.aiUsageRemaining === 1 ? "" : "es"} left this month`
    : "Upgrade to Starter or Pro to unlock";
  const aiChipLabel = entitlements.aiFixes
    ? aiUsage.aiUsageLimit === null
      ? "AI fixes unlimited"
      : `AI fixes ${aiUsage.aiUsageCurrent}/${aiUsage.aiUsageLimit}`
    : "AI fixes locked";

  return (
    <>
      <BillingStateRefresh enabled={searchParams?.upgraded === "1"} />
      <header className="sticky top-0 z-40 border-b border-border/60 bg-bg/70 backdrop-blur-xl">
        <div className="container-page flex flex-wrap items-center justify-between gap-3 py-4">
          <Link href="/" aria-label="a11ymind AI home" className="flex items-center">
            <Logo />
          </Link>
          <div className="flex min-w-0 flex-wrap items-center justify-end gap-2 sm:gap-3">
            <PlanBadge plan={user.plan} />
            {user.plan === "FREE" ? (
              <Link
                href="/pricing"
                className="hidden rounded-md border border-accent/40 bg-accent/10 px-3 py-1.5 text-sm font-medium text-accent transition-colors hover:bg-accent/20 sm:inline-flex"
              >
                Unlock AI fixes
              </Link>
            ) : (
              <a
                href="/api/stripe/portal"
                className="hidden text-sm text-text-muted transition-colors hover:text-text sm:inline"
              >
                Manage billing
              </a>
            )}
            <span className="hidden max-w-[14rem] truncate text-sm text-text-muted md:inline">
              {user.name || user.email}
            </span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main id="main" className="min-h-screen">

      {searchParams?.upgraded === "1" && (
        <section className="container-page">
          <div className="card flex flex-col gap-2 border-accent-muted bg-accent-muted/10 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-text">Your plan is active.</p>
              <p className="text-xs text-text-muted">
                a11ymind refreshed your billing state so your latest plan and entitlements are available now.
              </p>
            </div>
            <Link href="/pricing" className="text-sm text-accent hover:underline">
              Review plan details
            </Link>
          </div>
        </section>
      )}

      {searchParams?.error === "portal_failed" && (
        <section className="container-page">
          <div className="card flex flex-col gap-2 border-severity-critical/40 bg-severity-critical/10 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-text">We couldn&apos;t open the billing portal.</p>
              <p className="text-xs text-text-muted">
                Try again in a moment. If it keeps failing, verify your Stripe portal configuration and customer record.
              </p>
            </div>
            <Link href="/pricing" className="text-sm text-accent hover:underline">
              Back to pricing
            </Link>
          </div>
        </section>
      )}

      {searchParams?.error === "claim_unavailable" && (
        <section className="container-page">
          <div className="card flex flex-col gap-2 border-severity-critical/40 bg-severity-critical/10 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-text">
                We couldn&apos;t attach that scan to your account.
              </p>
              <p className="text-xs text-text-muted">
                The scan may no longer exist or may already belong to another account. Run a fresh scan to continue.
              </p>
            </div>
            <Link href="/" className="text-sm text-accent hover:underline">
              Run a new scan
            </Link>
          </div>
        </section>
      )}

      <section className="container-page mt-4">
        <div className="overflow-hidden rounded-[1.6rem] border border-border bg-[linear-gradient(180deg,rgba(14,17,22,0.92),rgba(14,17,22,0.76))] shadow-glow">
          <div className="grid gap-8 px-6 py-7 sm:px-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(280px,0.95fr)] lg:items-end">
            <div>
              <p className="text-[10px] uppercase tracking-[0.22em] text-text-subtle">
                Accessibility operations
              </p>
              <h1 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-text sm:text-4xl">
                Scan any page. Keep the pages that matter under watch.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-text-muted sm:text-base">
                {sites.length === 0
                  ? "Run a manual scan on any public URL, then save the individual pages you want a11ymind to keep monitoring over time. Each saved entry is one URL."
                  : `You currently have ${sites.length} monitored page${sites.length === 1 ? "" : "s"}. Use manual scans for fast checks, then turn important URLs into an ongoing workflow.`}
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-2 text-[11px] text-text-subtle">
                <span className="rounded-full border border-border px-2.5 py-1">
                  {`Monitor up to ${entitlements.maxSites} page${entitlements.maxSites === 1 ? "" : "s"}`}
                </span>
                <span className="rounded-full border border-border px-2.5 py-1">
                  {scanCadence}
                </span>
                <span className="rounded-full border border-border px-2.5 py-1">
                  {aiChipLabel}
                </span>
                <span className="rounded-full border border-border px-2.5 py-1">
                  PDF export {entitlements.pdfExport ? "enabled" : "locked"}
                </span>
              </div>
            </div>
            <div className="rounded-[1.25rem] border border-border/70 bg-bg-muted/25 p-4 sm:p-5">
              <p className="text-[10px] uppercase tracking-[0.18em] text-text-subtle">
                Run a fresh scan
              </p>
              <p className="mt-2 text-sm text-text-muted">
                Use manual scans for launch checks, client reviews, and fast validation on
                any public page.
              </p>
              <div className="mt-5">
                <URLScanner />
              </div>
            </div>
          </div>

          <div className="grid gap-px border-t border-border/70 bg-border/60 md:grid-cols-4">
          <DashboardStat
            label="Saved pages"
            value={`${sites.length}/${entitlements.maxSites}`}
            detail={`Monitor up to ${entitlements.maxSites} page${entitlements.maxSites === 1 ? "" : "s"}`}
          />
          <DashboardStat
            label="Scan cadence"
            value={scanCadence}
            detail={
              entitlements.autoScan === "none"
                ? "Run rescans on demand"
                : "Included on this plan"
            }
          />
          <DashboardStat
            label="AI fixes"
            value={aiFixesValue}
            detail={aiFixesDetail}
          />
          <DashboardStat
            label="PDF export"
            value={entitlements.pdfExport ? "Enabled" : "Locked"}
            detail={
              entitlements.pdfExport
                ? "Download reports from saved scans"
                : "Upgrade to Pro to unlock"
            }
          />
          </div>
        </div>

        <p className="mt-4 text-sm text-text-muted">
          Websites change often, which means new accessibility issues can appear anytime.
        </p>

        {atSiteLimit && user.plan !== "PRO" && (
          <div className="card mt-6 flex flex-col items-start justify-between gap-4 border-accent-muted bg-accent-muted/10 p-5 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-medium text-text">
                You can monitor {entitlements.maxSites} page{entitlements.maxSites === 1 ? "" : "s"} on your current plan. Each saved entry is one URL.
              </p>
              <p className="mt-1 text-sm text-text-muted">
                You can still scan any page manually. Upgrade to track more pages and keep monitoring changes as your site evolves.
              </p>
            </div>
            <Link href="/pricing" className="btn-primary whitespace-nowrap">
              Upgrade to monitor more pages
            </Link>
          </div>
        )}

        {sites.length === 0 && (
          <div className="card mt-6 border-accent-muted bg-accent-muted/10 p-6">
            <h2 className="text-lg font-semibold text-text">
              Scan your first page to start tracking accessibility improvements
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-text-muted">
              Run a scan on any public URL, then save individual pages (each entry is one URL) to monitor score changes, compare history, and catch new risks as the page evolves.
            </p>
          </div>
        )}
      </section>

      {sites.length > 0 && (
        <>
          <section className="container-page mt-8">
            <div className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border/60 md:grid-cols-4">
              <DashboardStat
                label="Scans this week"
                value={`${weekly.scanCount}`}
                detail={
                  weekly.scanCount === 0
                    ? "No scans yet this week"
                    : "Completed scheduled or manual scans"
                }
              />
              <DashboardStat
                label="Issues fixed"
                value={`${weekly.fixedIssues}`}
                detail="Resolved since last week's baseline"
              />
              <DashboardStat
                label="New issues"
                value={`${weekly.newIssues}`}
                detail={
                  weekly.newIssues === 0
                    ? "Nothing new appeared this week"
                    : "Regressions flagged since last week"
                }
              />
              <DashboardStat
                label="Avg score change"
                value={weekly.deltaLabel}
                detail={weekly.deltaDetail}
              />
            </div>
          </section>
          <section className="container-page mt-10">
            <div className="overflow-hidden rounded-[1.4rem] border border-border bg-bg-elevated/45">
              <div className="flex items-center justify-between border-b border-border/70 px-6 py-4">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-text-subtle">
                  Score history
                </h2>
                <span className="text-xs text-text-subtle">0–100, higher is better</span>
              </div>
              <div className="p-6">
                <ScoreHistoryChart data={chartData} series={series} />
              </div>
            </div>
          </section>
        </>
      )}

      <section className="container-page mt-10 space-y-4 pb-24">
        {sites.length > 0 && (
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-text-subtle">
                Monitored pages
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-text">
                The pages you&apos;re actively watching
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-text-muted">
                Each row is one URL. Re-scan on demand, review score movement, and open the latest report for any monitored page.
              </p>
            </div>
          </div>
        )}
        {sites.map((site) => {
          const latest = site.scans[site.scans.length - 1];
          const previous = site.scans[site.scans.length - 2];
          const band = latest ? scoreBand(latest.score) : null;
          const delta = latest && previous ? latest.score - previous.score : null;
          const regressionDiff =
            latest && previous
              ? buildRegressionDiff(latest.violations, previous.violations)
              : null;
          const badgeUrl = `${baseUrl}/badge/${site.id}`;
          const badgeSnippet = buildBadgeSnippet({
            homeUrl: baseUrl,
            badgeUrl,
          });
          return (
            <div key={site.id} className="overflow-hidden rounded-[1.35rem] border border-border bg-bg-elevated/35">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/70 px-5 py-4">
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-text-subtle">
                    {hostOf(site.url)}
                  </p>
                  <p className="truncate font-mono text-sm text-text">{site.url}</p>
                  <p className="mt-1 text-xs text-text-subtle">
                    {latest
                      ? `Last scanned ${formatRelative(latest.createdAt)} · ${site.scans.length} scan${site.scans.length === 1 ? "" : "s"}`
                      : "No completed scans yet"}
                  </p>
                  {delta !== null && (
                    <p className={`mt-2 text-xs ${delta >= 0 ? "text-accent" : "text-severity-critical"}`}>
                      {delta > 0 ? "+" : ""}
                      {delta} point{Math.abs(delta) === 1 ? "" : "s"} since last scan
                    </p>
                  )}
                </div>
                {latest && band && (
                  <div className="text-right">
                    <p
                      className="text-2xl font-semibold tabular-nums"
                      style={{ color: bandColor(band.tone) }}
                    >
                      {latest.score}
                    </p>
                    <p className="text-xs text-text-subtle">{band.label}</p>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  {latest && (
                    <Link href={`/scan/${latest.id}`} className="btn-ghost text-sm">
                      Open report
                    </Link>
                  )}
                  <RescanButton url={site.url} />
                </div>
              </div>
              <div className="grid gap-px bg-border/60 md:grid-cols-[minmax(0,1fr)_auto]">
                <div className="bg-bg px-5 py-4">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <SiteMiniMetric
                      label="Status"
                      value={latest && band ? band.label : "Waiting"}
                      tone={band?.tone}
                    />
                    <SiteMiniMetric
                      label="Latest score"
                      value={latest ? `${latest.score}/100` : "—"}
                    />
                    <SiteMiniMetric
                      label="Trend"
                      value={
                        delta === null
                          ? "Need 2 scans"
                          : `${delta > 0 ? "+" : ""}${delta} points`
                      }
                    />
                  </div>
                  {previous && regressionDiff && (
                    <div className="mt-4 rounded-xl border border-border bg-bg-elevated/35 p-4">
                      <p className="text-[10px] uppercase tracking-[0.18em] text-text-subtle">
                        Regression diff
                      </p>
                      {entitlements.regressionDiffs ? (
                        <>
                          <p className="mt-2 text-sm text-text">
                            {regressionDiff.fixedCount} fixed · {regressionDiff.newCount} new ·{" "}
                            {regressionDiff.unchangedCount} unchanged rule type
                            {regressionDiff.unchangedCount === 1 ? "" : "s"}
                          </p>
                          <p className="mt-1 text-xs text-text-muted">
                            Open the latest report to see which accessibility risks were introduced or resolved between scans.
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="mt-2 text-sm text-text">
                            Unlock rule-level diffs between saved scans.
                          </p>
                          <p className="mt-1 text-xs text-text-muted">
                            Pro shows which risk types are new, fixed, or unchanged across monitoring history.
                          </p>
                          <Link href="/pricing" className="mt-3 inline-flex text-xs text-accent hover:underline">
                            Unlock regression diffs →
                          </Link>
                        </>
                      )}
                    </div>
                  )}
                </div>
                <div className="bg-bg px-5 py-4 md:min-w-[220px]">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-text-subtle">
                    Monitoring cadence
                  </p>
                  <p className="mt-2 text-sm font-medium text-text">{scanCadence}</p>
                  <p className="mt-1 text-xs text-text-muted">
                    Websites change constantly, so this site stays in your monitoring loop.
                  </p>
                </div>
              </div>
              {entitlements.monitoringBadge && (
                <div className="border-t border-border/70 px-5 py-4">
                  <BadgeEmbedCard
                    siteUrl={site.url}
                    badgeUrl={badgeUrl}
                    snippet={badgeSnippet}
                  />
                </div>
              )}
              {entitlements.ciIntegration && (
                <div className="border-t border-border/70 px-5 py-4">
                  <CiHistoryCard
                    siteUrl={site.url}
                    endpoint={`${baseUrl}/api/ci/report`}
                    token={site.ciIngestToken}
                    checks={site.ciChecks}
                  />
                </div>
              )}
              {entitlements.slackAlerts && (
                <div className="border-t border-border/70 px-5 py-4">
                  <SlackWebhookCard
                    siteId={site.id}
                    configured={Boolean(site.slackWebhookUrl)}
                  />
                </div>
              )}
            </div>
          );
        })}
      </section>
    </main>
    </>
  );
}

function DashboardStat({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="bg-bg-elevated/60 p-4">
      <p className="text-xs uppercase tracking-wider text-text-subtle">{label}</p>
      <p className="mt-2 text-lg font-semibold text-text">{value}</p>
      <p className="mt-1 text-xs text-text-muted">{detail}</p>
    </div>
  );
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function bandColor(tone: "good" | "warn" | "bad"): string {
  return tone === "good" ? "#22c55e" : tone === "warn" ? "#f59e0b" : "#ef4444";
}

function formatRelative(date: Date): string {
  const diff = Date.now() - date.getTime();
  const min = 60_000,
    hour = 60 * min,
    day = 24 * hour;
  if (diff < hour) return `${Math.max(1, Math.round(diff / min))}m ago`;
  if (diff < day) return `${Math.round(diff / hour)}h ago`;
  if (diff < 14 * day) return `${Math.round(diff / day)}d ago`;
  return date.toLocaleDateString();
}

function buildChartData(
  sites: { id: string; url: string; scans: { createdAt: Date; score: number }[] }[],
): ChartPoint[] {
  const allDates = new Set<number>();
  for (const site of sites) {
    for (const scan of site.scans) allDates.add(scan.createdAt.getTime());
  }
  const sorted = Array.from(allDates).sort((a, b) => a - b);

  const lookup = new Map<string, Map<number, number>>();
  for (const site of sites) {
    const m = new Map<number, number>();
    for (const scan of site.scans) m.set(scan.createdAt.getTime(), scan.score);
    lookup.set(site.id, m);
  }

  return sorted.map((ts): ChartPoint => {
    const point: ChartPoint = {
      ts,
      label: new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    };
    for (const site of sites) {
      const score = lookup.get(site.id)?.get(ts);
      if (score !== undefined) point[site.id] = score;
    }
    return point;
  });
}

function normalizeBaseUrl(url: string) {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

async function buildWeeklySummary(userId: string) {
  const now = Date.now();
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const weekStart = new Date(now - weekMs);
  const previousWeekStart = new Date(now - 2 * weekMs);

  const scans = await prisma.scan.findMany({
    where: {
      userId,
      status: "COMPLETED",
      createdAt: { gte: previousWeekStart },
    },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      score: true,
      createdAt: true,
      siteId: true,
      violations: { select: { axeId: true } },
    },
  });

  const thisWeek = scans.filter((s) => s.createdAt >= weekStart);
  const scanCount = thisWeek.length;

  // Per-site diff: first in-window scan vs latest in-window scan.
  const bySite = new Map<string, typeof scans>();
  for (const s of scans) {
    if (!s.siteId) continue;
    const arr = bySite.get(s.siteId) ?? [];
    arr.push(s);
    bySite.set(s.siteId, arr);
  }

  let newIssues = 0;
  let fixedIssues = 0;
  const deltas: number[] = [];
  for (const [, siteScans] of bySite) {
    const latest = siteScans[siteScans.length - 1];
    const baseline = siteScans.find((s) => s.createdAt < weekStart) ?? siteScans[0];
    if (!latest || latest === baseline) continue;
    const latestSet = new Set(latest.violations.map((v) => v.axeId));
    const baseSet = new Set(baseline.violations.map((v) => v.axeId));
    for (const id of latestSet) if (!baseSet.has(id)) newIssues += 1;
    for (const id of baseSet) if (!latestSet.has(id)) fixedIssues += 1;
    deltas.push(latest.score - baseline.score);
  }

  const avgDelta = deltas.length
    ? Math.round(deltas.reduce((a, b) => a + b, 0) / deltas.length)
    : 0;
  const deltaLabel =
    deltas.length === 0
      ? "—"
      : avgDelta === 0
        ? "No change"
        : `${avgDelta > 0 ? "+" : ""}${avgDelta}`;
  const deltaDetail =
    deltas.length === 0
      ? "Needs two scans to compare"
      : avgDelta > 0
        ? "Average improvement across monitored pages"
        : avgDelta < 0
          ? "Average regression across monitored pages"
          : "Scores held steady";

  return { scanCount, newIssues, fixedIssues, deltaLabel, deltaDetail };
}

function buildBadgeSnippet({
  homeUrl,
  badgeUrl,
}: {
  homeUrl: string;
  badgeUrl: string;
}) {
  return `<a href="${homeUrl}" target="_blank" rel="noopener noreferrer" aria-label="Accessibility monitored by a11ymind">
  <img src="${badgeUrl}" alt="Accessibility monitored by a11ymind" style="height:36px;width:auto;border:0" />
</a>`;
}

function SiteMiniMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "good" | "warn" | "bad";
}) {
  return (
    <div className="rounded-xl border border-border bg-bg-elevated/35 p-3">
      <p className="text-[10px] uppercase tracking-[0.18em] text-text-subtle">{label}</p>
      <p
        className="mt-2 text-sm font-medium"
        style={tone ? { color: bandColor(tone) } : undefined}
      >
        {value}
      </p>
    </div>
  );
}
