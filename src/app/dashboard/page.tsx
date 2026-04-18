import Link from "next/link";
import { redirect } from "next/navigation";
import { BadgeEmbedCard } from "@/components/BadgeEmbedCard";
import { BillingStateRefresh } from "@/components/BillingStateRefresh";
import { Logo } from "@/components/Logo";
import { PlanBadge } from "@/components/PlanBadge";
import { SignOutButton } from "@/components/UserMenu";
import { RescanButton } from "@/components/RescanButton";
import { URLScanner } from "@/components/URLScanner";
import {
  ScoreHistoryChart,
  type ChartPoint,
  type ChartSeries,
} from "@/components/ScoreHistoryChart";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { scoreBand } from "@/lib/score";
import {
  autoScanLabel,
  entitlementsFor,
  isAtSiteLimit,
} from "@/lib/entitlements";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dashboard — Accessly" };

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
    include: {
      scans: {
        where: { status: "COMPLETED" },
        orderBy: { createdAt: "asc" },
        select: { id: true, score: true, createdAt: true },
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

  return (
    <main className="min-h-screen">
      <BillingStateRefresh enabled={searchParams?.upgraded === "1"} />
      <header className="container-page flex flex-wrap items-center justify-between gap-4 py-6">
        <Link href="/">
          <Logo />
        </Link>
        <div className="flex items-center gap-4">
          <PlanBadge plan={user.plan} />
          {user.plan === "FREE" ? (
            <Link href="/pricing" className="text-sm text-accent hover:underline">
              Get AI fixes
            </Link>
          ) : (
            <Link
              href="/api/stripe/portal"
              className="text-sm text-text-muted hover:text-text"
            >
              Manage billing
            </Link>
          )}
          <span className="hidden text-sm text-text-muted sm:inline">
            {user.name || user.email}
          </span>
          <SignOutButton />
        </div>
      </header>

      {searchParams?.upgraded === "1" && (
        <section className="container-page">
          <div className="card flex flex-col gap-2 border-accent-muted bg-accent-muted/10 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-text">Your subscription is active.</p>
              <p className="text-xs text-text-muted">
                Accessly refreshed your billing state so your latest plan and entitlements are available now.
              </p>
            </div>
            <Link href="/pricing" className="text-sm text-accent hover:underline">
              Start monitoring
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

      <section className="container-page mt-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Scan any page. Monitor saved sites.</h1>
            <p className="mt-1 text-sm text-text-muted">
              {sites.length === 0
                ? "Run a manual scan on any URL, then save the sites you want Accessly to keep monitoring."
                : `${sites.length} website${sites.length === 1 ? "" : "s"} currently being monitored.`}
            </p>
          </div>
          <div className="w-full sm:w-auto sm:min-w-[28rem]">
            <URLScanner />
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <DashboardStat
            label="Saved sites"
            value={`${sites.length}/${entitlements.maxSites}`}
            detail={
              entitlements.maxSites === 1
                ? "Monitor 1 website"
                : "Monitor up to 10 websites"
            }
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
            value={entitlements.aiFixes ? "Enabled" : "Locked"}
            detail={
              entitlements.aiFixes
                ? "Saved scan results include remediation guidance"
                : "Upgrade to Starter or Pro to unlock"
            }
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

        <p className="mt-4 text-sm text-text-muted">
          Websites change often, which means new accessibility issues can appear anytime.
        </p>

        {atSiteLimit && user.plan !== "PRO" && (
          <div className="card mt-6 flex flex-col items-start justify-between gap-4 border-accent-muted bg-accent-muted/10 p-5 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-medium text-text">
                You can monitor {entitlements.maxSites} website{entitlements.maxSites === 1 ? "" : "s"} on your current plan.
              </p>
              <p className="mt-1 text-sm text-text-muted">
                You can still scan any page manually. Upgrade to track more sites and keep monitoring changes as your site evolves.
              </p>
            </div>
            <Link href="/pricing" className="btn-primary whitespace-nowrap">
              Start monitoring
            </Link>
          </div>
        )}

        {sites.length === 0 && (
          <div className="card mt-6 border-accent-muted bg-accent-muted/10 p-6">
            <h2 className="text-lg font-semibold text-text">
              Scan your first site to start tracking accessibility improvements
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-text-muted">
              Run a scan on any public page, then save the websites you care about to monitor score changes, compare history, and catch new risks as the site evolves.
            </p>
          </div>
        )}
      </section>

      {sites.length > 0 && (
        <>
          <section className="container-page mt-8">
            <div className="grid gap-4 md:grid-cols-4">
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
            <div className="card p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-text-subtle">
                  Score history
                </h2>
                <span className="text-xs text-text-subtle">0–100, higher is better</span>
              </div>
              <ScoreHistoryChart data={chartData} series={series} />
            </div>
          </section>
        </>
      )}

      <section className="container-page mt-10 space-y-4 pb-24">
        {sites.map((site) => {
          const latest = site.scans[site.scans.length - 1];
          const previous = site.scans[site.scans.length - 2];
          const band = latest ? scoreBand(latest.score) : null;
          const delta = latest && previous ? latest.score - previous.score : null;
          const badgeUrl = `${baseUrl}/badge/${site.id}`;
          const badgeSnippet = buildBadgeSnippet({
            homeUrl: baseUrl,
            badgeUrl,
          });
          return (
            <div key={site.id} className="card p-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
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
                      View
                    </Link>
                  )}
                  <RescanButton url={site.url} />
                </div>
              </div>
              {entitlements.monitoringBadge && (
                <BadgeEmbedCard
                  siteUrl={site.url}
                  badgeUrl={badgeUrl}
                  snippet={badgeSnippet}
                />
              )}
            </div>
          );
        })}
      </section>
    </main>
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
    <div className="card p-4">
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
        ? "Average improvement across monitored sites"
        : avgDelta < 0
          ? "Average regression across monitored sites"
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
  return `<a href="${homeUrl}" target="_blank" rel="noopener noreferrer" aria-label="Accessibility monitored by Accessly">
  <img src="${badgeUrl}" alt="Accessibility monitored by Accessly" style="height:36px;width:auto;border:0" />
</a>`;
}
