import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { redirect } from "next/navigation";
import { SiteFooter } from "@/components/SiteFooter";
import { BadgeEmbedCard } from "@/components/BadgeEmbedCard";
import { BillingStateRefresh } from "@/components/BillingStateRefresh";
import { CiHistoryCard } from "@/components/CiHistoryCard";
import { AccessLintCiCard } from "@/components/AccessLintCiCard";
import { CrawlSiteButton } from "@/components/CrawlSiteButton";
import { Logo } from "@/components/Logo";
import { OnboardingChecklist } from "@/components/OnboardingChecklist";
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
  searchParams?: Promise<{ upgraded?: string; error?: string }>;
}) {
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, name: true, plan: true },
  });
  if (!user) redirect("/login");

  const [sites, completedScanCount] = await Promise.all([
    prisma.site.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      url: true,
      project: {
        select: {
          id: true,
          name: true,
          origin: true,
          ciIngestToken: true,
          slackWebhookUrl: true,
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
      },
      page: {
        select: {
          id: true,
          url: true,
        },
      },
      ciIngestToken: true,
      slackWebhookUrl: true,
      scans: {
        where: { status: "COMPLETED" },
        // Most-recent 50 are enough for the trend chart; older history
        // remains available on /scans without inflating dashboard payload.
        orderBy: { createdAt: "desc" },
        take: 50,
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
    }),
    prisma.scan.count({
      where: { userId: session.user.id, status: "COMPLETED" },
    }),
  ]);

  // Scans were fetched newest-first to bound the take(50). Flip to ascending
  // so trend chart and `scans[length-1] = latest` consumers stay correct.
  for (const site of sites) site.scans.reverse();

  const hasScans = completedScanCount > 0;
  const hasSite = sites.length > 0;
  const hasCiToken = sites.some(
    (s) => Boolean(s.ciIngestToken) || Boolean(s.project?.ciIngestToken),
  );
  const showOnboarding = !(hasScans && hasSite && hasCiToken);

  const series: ChartSeries[] = sites.map((s, i) => ({
    key: s.id,
    label: hostOf(s.url),
    color: SERIES_COLORS[i % SERIES_COLORS.length],
  }));

  const chartData = buildChartData(sites);
  const projectGroups = groupSitesByProject(sites);
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
      ? "AI remediation guidance on every monitored scan"
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
      <BillingStateRefresh enabled={resolvedSearchParams?.upgraded === "1"} />
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
            <Link
              href="/scans"
              className="hidden text-sm text-text-muted transition-colors hover:text-text sm:inline"
            >
              History
            </Link>
            <Link
              href="/settings"
              className="hidden text-sm text-text-muted transition-colors hover:text-text sm:inline"
            >
              Settings
            </Link>
            <span className="hidden max-w-[14rem] truncate text-sm text-text-muted md:inline">
              {user.name || user.email}
            </span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main id="main" className="page-shell-gradient min-h-screen">

      {resolvedSearchParams?.upgraded === "1" && (
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

      {resolvedSearchParams?.error === "portal_failed" && (
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

      {resolvedSearchParams?.error === "claim_unavailable" && (
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
        <div className="surface-premium rounded-[1.75rem]">
          <div className="grid gap-8 px-6 py-7 sm:px-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(280px,0.95fr)] lg:items-end">
            <div>
              <p className="section-kicker">
                Accessibility operations
              </p>
              <h1 className="mt-3 max-w-3xl text-balance text-3xl font-semibold tracking-[-0.03em] text-text sm:text-5xl">
                Scan any page. Keep the pages that matter under watch.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-text-muted sm:text-base">
                {sites.length === 0
                  ? "Run a manual scan on any public URL, then save the website pages you want a11ymind to keep monitoring over time."
                  : `You currently have ${sites.length} monitored page${sites.length === 1 ? "" : "s"}. Use manual scans for fast checks, then turn important URLs into an ongoing workflow.`}
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-2 text-[11px] text-text-subtle">
                <span className="rounded-full border border-border px-2.5 py-1">
                  {`${entitlements.maxProjects} website${entitlements.maxProjects === 1 ? "" : "s"} · ${entitlements.maxPagesPerProject} page${entitlements.maxPagesPerProject === 1 ? "" : "s"} each`}
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
            <div className="rounded-[1.35rem] border border-white/10 bg-bg/55 p-4 shadow-card backdrop-blur-md sm:p-5">
              <p className="section-kicker">
                Run a fresh scan
              </p>
              <p className="mt-2 text-sm text-text-muted">
                Use manual scans for launch checks, client reviews, and fast validation on
                any public page.
              </p>
              <div className="mt-5">
                <URLScanner
                  ctaLabel="Run scan"
                  helperText="Manual scans are useful for launch checks and spot reviews. Save important URLs to keep them monitored over time."
                />
              </div>
            </div>
          </div>

          <div className="grid gap-px border-t border-white/10 bg-white/10 md:grid-cols-4">
          <DashboardStat
            label="Monitored pages"
            value={`${sites.length}/${entitlements.maxSites}`}
            detail={`${projectGroups.length}/${entitlements.maxProjects} website${entitlements.maxProjects === 1 ? "" : "s"} used`}
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
                ? "Download reports from monitored scans"
                : "Upgrade to Starter or Pro to unlock"
            }
          />
          </div>
        </div>

        <p className="mt-4 text-sm text-text-muted">
          Use manual scans for fast validation, then keep important pages monitored so regressions show up in history.
        </p>

        {atSiteLimit && user.plan !== "PRO" && (
          <div className="card mt-6 flex flex-col items-start justify-between gap-4 border-accent-muted bg-accent-muted/10 p-5 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-medium text-text">
                You can monitor {entitlements.maxProjects} website{entitlements.maxProjects === 1 ? "" : "s"} with up to {entitlements.maxPagesPerProject} page{entitlements.maxPagesPerProject === 1 ? "" : "s"} each on your current plan.
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
              Run a scan on any public URL, then save website pages to monitor score changes, compare history, and catch new risks as the page evolves.
            </p>
          </div>
        )}
      </section>

      {showOnboarding && (
        <section className="container-page mt-6">
          <OnboardingChecklist
            hasScans={hasScans}
            hasSite={hasSite}
            hasCiToken={hasCiToken}
            plan={user.plan}
          />
        </section>
      )}

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
                Each project groups monitored pages for one website. Paid plans can discover same-origin pages from sitemap and homepage links, then add them up to the page limit.
              </p>
            </div>
          </div>
        )}
        {projectGroups.map((group) => (
          <div key={group.key} className="space-y-3">
            <ProjectHealthSummary
              group={group}
              scanCadence={scanCadence}
              canDiscoverPages={user.plan !== "FREE"}
              entitlements={entitlements}
              baseUrl={baseUrl}
            />
            {group.sites.map((site) => {
          const latest = site.scans[site.scans.length - 1];
          const previous = site.scans[site.scans.length - 2];
          const band = latest ? scoreBand(latest.score) : null;
          const delta = latest && previous ? latest.score - previous.score : null;
          const regressionDiff =
            latest && previous
              ? buildRegressionDiff(latest.violations, previous.violations)
              : null;
          return (
            <details key={site.id} className="group overflow-hidden rounded-[1.35rem] border border-white/10 bg-bg-elevated/35 shadow-card">
              <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-4 px-5 py-4 marker:hidden">
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-text-subtle">
                    Monitored page
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
                <span className="rounded-full border border-border px-2.5 py-1 text-xs text-text-subtle transition-colors group-open:border-accent/40 group-open:text-accent">
                  Details
                </span>
              </summary>
              <div className="grid gap-px bg-border/60 md:grid-cols-[minmax(0,1fr)_auto]">
                <div className="bg-bg px-5 py-4">
                  <div className="mb-4 flex flex-wrap items-center gap-2">
                    {latest && (
                      <Link href={`/scan/${latest.id}`} className="btn-ghost text-sm">
                        Open report
                      </Link>
                    )}
                    <RescanButton url={site.url} />
                  </div>
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
                            Unlock selector-level diffs between monitored scans.
                          </p>
                          <p className="mt-1 text-xs text-text-muted">
                            Pro shows which affected locations are new, fixed, or unchanged across monitoring history.
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
                    Websites change constantly, so this page stays in your monitoring loop.
                  </p>
                </div>
              </div>
            </details>
          );
            })}
          </div>
        ))}
      </section>
    </main>
    <SiteFooter />
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
    <div className="metric-tile">
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
      pageId: true,
      siteId: true,
      violations: { select: { axeId: true } },
    },
  });

  const thisWeek = scans.filter((s) => s.createdAt >= weekStart);
  const scanCount = thisWeek.length;

  // Per-page diff: first in-window scan vs latest in-window scan. Falls back
  // to legacy siteId for historical rows that predate Page.
  const byPage = new Map<string, typeof scans>();
  for (const s of scans) {
    const key = s.pageId ? `page:${s.pageId}` : s.siteId ? `site:${s.siteId}` : null;
    if (!key) continue;
    const arr = byPage.get(key) ?? [];
    arr.push(s);
    byPage.set(key, arr);
  }

  let newIssues = 0;
  let fixedIssues = 0;
  const deltas: number[] = [];
  for (const [, pageScans] of byPage) {
    const latest = pageScans[pageScans.length - 1];
    const baseline = pageScans.find((s) => s.createdAt < weekStart) ?? pageScans[0];
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

function ProjectHealthSummary<TSite extends ProjectGroupSite>({
  group,
  scanCadence,
  canDiscoverPages,
  entitlements,
  baseUrl,
}: {
  group: ProjectGroup<TSite>;
  scanCadence: string;
  canDiscoverPages: boolean;
  entitlements: ReturnType<typeof entitlementsFor>;
  baseUrl: string;
}) {
  const health = projectHealthFor(group.sites);
  const band = health.averageScore === null ? null : scoreBand(health.averageScore);
  const primarySite = group.sites[0];
  const attentionLabel = health.worstSite
    ? `${hostOf(health.worstSite.url)} · ${health.worstScore}/100`
    : "Run first scan";
  const badgeUrl = `${baseUrl}/badge/${primarySite.id}`;
  const badgeSnippet = buildBadgeSnippet({
    homeUrl: group.origin,
    badgeUrl,
  });

  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-[linear-gradient(180deg,rgba(17,20,27,0.78),rgba(12,14,19,0.74))] shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-5">
        <div>
          <p className="section-kicker">
            Website project
          </p>
          <h3 className="mt-1 text-xl font-semibold tracking-tight text-text">{group.label}</h3>
          <p className="mt-1 text-xs text-text-muted">
            {group.sites.length} monitored page{group.sites.length === 1 ? "" : "s"} · {group.origin}
          </p>
        </div>
        {canDiscoverPages && <CrawlSiteButton siteId={group.sites[0].id} />}
      </div>

      <div className="grid gap-px border-t border-white/10 bg-white/10 md:grid-cols-5">
        <ProjectMiniMetric
          label="Project health"
          value={health.averageScore === null ? "Waiting" : `${health.averageScore}/100`}
          detail={band?.label ?? "No completed scans yet"}
          tone={band?.tone}
        />
        <ProjectMiniMetric
          label="Coverage"
          value={`${health.scannedPages}/${group.sites.length}`}
          detail="Monitored pages with scans"
        />
        <ProjectMiniMetric
          label="Needs attention"
          value={attentionLabel}
          detail={health.openIssues === 0 ? "No automated issues detected" : `${health.openIssues} latest issue${health.openIssues === 1 ? "" : "s"}`}
          tone={health.worstScore !== null ? scoreBand(health.worstScore).tone : undefined}
        />
        <ProjectMiniMetric
          label="Regressions"
          value={`${health.regressingPages}`}
          detail={health.regressingPages === 0 ? "No page score drops" : "Pages down since previous scan"}
          tone={health.regressingPages > 0 ? "bad" : "good"}
        />
        <ProjectMiniMetric
          label="Monitoring"
          value={scanCadence}
          detail="Applied to each monitored page"
        />
      </div>
      <div className="grid gap-px border-t border-white/10 bg-white/10 lg:grid-cols-3">
        <ProjectControlPanel title="Page discovery">
          {canDiscoverPages ? (
            <>
              <p className="text-sm text-text-muted">
                Find same-origin pages from the sitemap and homepage links, then start scans up to your plan limit.
              </p>
              <div className="mt-4">
                <CrawlSiteButton siteId={primarySite.id} />
              </div>
            </>
          ) : (
            <UpgradeControl
              body="Upgrade to Starter to discover and monitor more pages on this website."
              cta="Compare plans"
            />
          )}
        </ProjectControlPanel>

        <ProjectControlPanel title="CI history">
          {entitlements.ciIntegration ? (
            <CiHistoryCard
              siteId={primarySite.id}
              siteUrl={group.origin}
              endpoint={`${baseUrl}/api/ci/report`}
              token={primarySite.project?.ciIngestToken ?? primarySite.ciIngestToken}
              checks={primarySite.project?.ciChecks ?? primarySite.ciChecks}
              compact
            />
          ) : (
            <AccessLintCiCard compact />
          )}
        </ProjectControlPanel>

        <ProjectControlPanel title="Alerts and proof">
          <div className="space-y-4">
            {entitlements.slackAlerts ? (
              <SlackWebhookCard
                siteId={primarySite.id}
                configured={Boolean(primarySite.project?.slackWebhookUrl ?? primarySite.slackWebhookUrl)}
                compact
              />
            ) : (
              <UpgradeControl
                body="Pro adds Slack alerts when monitored pages regress."
                cta="Unlock Slack alerts"
              />
            )}
            {entitlements.monitoringBadge ? (
              <BadgeEmbedCard
                siteUrl={group.origin}
                badgeUrl={badgeUrl}
                snippet={badgeSnippet}
                compact
              />
            ) : (
              <p className="text-xs text-text-subtle">
                Monitoring badges are included on Starter and Pro.
              </p>
            )}
          </div>
        </ProjectControlPanel>
      </div>
    </div>
  );
}

function ProjectControlPanel({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="metric-tile">
      <p className="text-[10px] uppercase tracking-[0.18em] text-text-subtle">{title}</p>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function UpgradeControl({ body, cta }: { body: string; cta: string }) {
  return (
    <div className="rounded-xl border border-border bg-bg-elevated/35 p-4">
      <p className="text-sm text-text-muted">{body}</p>
      <Link href="/pricing" className="mt-3 inline-flex text-xs text-accent hover:underline">
        {cta} →
      </Link>
    </div>
  );
}

function ProjectMiniMetric({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  tone?: "good" | "warn" | "bad";
}) {
  return (
    <div className="bg-bg/70 px-4 py-4 backdrop-blur-sm">
      <p className="text-[10px] uppercase tracking-[0.18em] text-text-subtle">{label}</p>
      <p
        className="mt-2 truncate text-sm font-semibold text-text"
        style={tone ? { color: bandColor(tone) } : undefined}
        title={value}
      >
        {value}
      </p>
      <p className="mt-1 text-xs text-text-muted">{detail}</p>
    </div>
  );
}

function projectHealthFor<TSite extends ProjectGroupSite>(sites: TSite[]) {
  let scannedPages = 0;
  let openIssues = 0;
  let regressingPages = 0;
  let worstScore: number | null = null;
  let worstSite: TSite | null = null;
  const latestScores: number[] = [];

  for (const site of sites) {
    const latest = site.scans[site.scans.length - 1];
    if (!latest) continue;

    scannedPages += 1;
    latestScores.push(latest.score);
    openIssues += latest.violations.length;

    const previous = site.scans[site.scans.length - 2];
    if (previous && latest.score < previous.score) {
      regressingPages += 1;
    }

    if (worstScore === null || latest.score < worstScore) {
      worstScore = latest.score;
      worstSite = site;
    }
  }

  return {
    averageScore: latestScores.length
      ? Math.round(latestScores.reduce((sum, score) => sum + score, 0) / latestScores.length)
      : null,
    scannedPages,
    openIssues,
    regressingPages,
    worstScore,
    worstSite,
  };
}

type ProjectGroupSite = {
  id: string;
  url: string;
  ciIngestToken: string;
  slackWebhookUrl: string | null;
  ciChecks: ComponentProps<typeof CiHistoryCard>["checks"];
  project: {
    id: string;
    name: string | null;
    origin: string;
    ciIngestToken: string | null;
    slackWebhookUrl: string | null;
    ciChecks: ComponentProps<typeof CiHistoryCard>["checks"];
  } | null;
  scans: {
    score: number;
    violations: { axeId: string }[];
  }[];
};

type ProjectGroup<TSite extends ProjectGroupSite> = {
  key: string;
  label: string;
  origin: string;
  sites: TSite[];
};

function groupSitesByProject<TSite extends {
  id: string;
  url: string;
  ciIngestToken: string;
  slackWebhookUrl: string | null;
  ciChecks: ComponentProps<typeof CiHistoryCard>["checks"];
  project: {
    id: string;
    name: string | null;
    origin: string;
    ciIngestToken: string | null;
    slackWebhookUrl: string | null;
    ciChecks: ComponentProps<typeof CiHistoryCard>["checks"];
  } | null;
  scans: { score: number; violations: { axeId: string }[] }[];
}>(sites: TSite[]): ProjectGroup<TSite>[] {
  const groups = new Map<
    string,
    ProjectGroup<TSite>
  >();

  for (const site of sites) {
    const origin = site.project?.origin ?? originOf(site.url);
    const key = site.project?.id ?? origin;
    const group = groups.get(key) ?? {
      key,
      label: site.project?.name || hostOf(origin),
      origin,
      sites: [],
    };
    group.sites.push(site);
    groups.set(key, group);
  }

  return [...groups.values()];
}

function originOf(url: string): string {
  try {
    return new URL(url).origin;
  } catch {
    return url;
  }
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
