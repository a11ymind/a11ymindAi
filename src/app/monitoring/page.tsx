import { redirect } from "next/navigation";
import type { ViolationStatus } from "@prisma/client";
import { AppHeader } from "@/components/AppHeader";
import {
  ProjectActivityFeed,
  type ProjectActivityItem,
} from "@/components/ProjectActivityFeed";
import {
  ScoreHistoryChart,
  type ChartPoint,
  type ChartSeries,
} from "@/components/ScoreHistoryChart";
import { SiteFooter } from "@/components/SiteFooter";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hostOf, originOf } from "@/lib/dashboard-format";
import { VIOLATION_STATUS_LABELS } from "@/lib/violation-status";

export const dynamic = "force-dynamic";
export const metadata = { title: "Monitoring — a11ymind AI" };

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

type ProjectChartRow = {
  id: string;
  name: string | null;
  origin: string;
  sites: { scans: { score: number; createdAt: Date }[] }[];
};

export default async function MonitoringPage() {
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, plan: true },
  });
  if (!user) redirect("/login");

  // One line per project (= per website). The trend value at each daily
  // bucket is the average of all that project's page scans on that day.
  const projects = await prisma.project.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      origin: true,
      sites: {
        select: {
          scans: {
            where: { status: "COMPLETED" },
            orderBy: { createdAt: "desc" },
            take: 50,
            select: { score: true, createdAt: true },
          },
        },
      },
    },
  });

  const series: ChartSeries[] = projects.map((p, i) => ({
    key: p.id,
    label: p.name || hostOf(p.origin),
    color: SERIES_COLORS[i % SERIES_COLORS.length],
  }));

  const chartData = buildProjectChartData(projects);

  // Activity feed: most-recent events + comments across the user's latest scans.
  const sites = await prisma.site.findMany({
    where: { userId: session.user.id },
    select: {
      id: true,
      url: true,
      project: { select: { name: true, origin: true } },
      scans: {
        where: { status: "COMPLETED" },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { id: true },
      },
    },
  });

  const scanContext = new Map<string, { siteUrl: string; projectLabel: string }>();
  const latestScanIds: string[] = [];
  for (const site of sites) {
    const latest = site.scans[0];
    if (!latest) continue;
    latestScanIds.push(latest.id);
    const projectLabel =
      site.project?.name || hostOf(site.project?.origin ?? originOf(site.url));
    scanContext.set(latest.id, { siteUrl: site.url, projectLabel });
  }

  const [events, comments] = latestScanIds.length
    ? await Promise.all([
        prisma.violationEvent.findMany({
          where: { violation: { scanId: { in: latestScanIds } } },
          orderBy: { createdAt: "desc" },
          take: 30,
          select: {
            id: true,
            fromStatus: true,
            toStatus: true,
            createdAt: true,
            user: { select: { name: true, email: true } },
            violation: { select: { help: true, scanId: true } },
          },
        }),
        prisma.violationComment.findMany({
          where: { violation: { scanId: { in: latestScanIds } } },
          orderBy: { createdAt: "desc" },
          take: 30,
          select: {
            id: true,
            body: true,
            createdAt: true,
            user: { select: { name: true, email: true } },
            violation: { select: { help: true, scanId: true } },
          },
        }),
      ])
    : [[], []];

  const activityItems = buildActivity(events, comments, scanContext);

  return (
    <>
      <AppHeader user={user} active="monitoring" />
      <main id="main" className="page-shell-gradient min-h-screen">
        <section className="container-page mt-8">
          <p className="section-kicker">Monitoring</p>
          <h1 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-text sm:text-4xl">
            Accessibility health over time
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-text-muted">
            One trend line per website, averaged daily across every page you monitor on it. Use this to spot regressions
            before they reach customers.
          </p>
        </section>
        <section className="container-page mt-8">
          <div className="overflow-hidden rounded-[1.6rem] border border-white/10 bg-bg-elevated/45 shadow-card">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 px-6 py-5">
              <div>
                <p className="section-kicker">Score history</p>
                <h2 className="mt-2 text-xl font-semibold tracking-tight text-text">
                  Score per website, daily average
                </h2>
                <p className="mt-1 text-sm text-text-muted">
                  Green is healthy, amber needs review, red needs attention.
                </p>
              </div>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-text-subtle">
                0–100, higher is better
              </span>
            </div>
            <div className="p-6">
              <ScoreHistoryChart data={chartData} series={series} />
            </div>
          </div>
        </section>
        <section className="container-page mt-10 pb-16">
          <ProjectActivityFeed items={activityItems} itemLimit={20} />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function buildProjectChartData(projects: ProjectChartRow[]): ChartPoint[] {
  // Bucket every project's scans into UTC days, average the scores within
  // each day, and merge into a shared timeline keyed by day timestamp.
  const dayMs = 24 * 60 * 60 * 1000;

  function dayBucket(date: Date): number {
    return Math.floor(date.getTime() / dayMs) * dayMs;
  }

  const allBuckets = new Set<number>();
  const lookup = new Map<string, Map<number, number>>();

  for (const project of projects) {
    const sumByBucket = new Map<number, { sum: number; count: number }>();
    for (const site of project.sites) {
      for (const scan of site.scans) {
        const bucket = dayBucket(scan.createdAt);
        allBuckets.add(bucket);
        const acc = sumByBucket.get(bucket) ?? { sum: 0, count: 0 };
        acc.sum += scan.score;
        acc.count += 1;
        sumByBucket.set(bucket, acc);
      }
    }
    const averages = new Map<number, number>();
    for (const [bucket, acc] of sumByBucket.entries()) {
      averages.set(bucket, Math.round(acc.sum / acc.count));
    }
    lookup.set(project.id, averages);
  }

  const sortedBuckets = Array.from(allBuckets).sort((a, b) => a - b).slice(-30);

  return sortedBuckets.map((ts): ChartPoint => {
    const point: ChartPoint = {
      ts,
      label: new Date(ts).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
    };
    for (const project of projects) {
      const score = lookup.get(project.id)?.get(ts);
      if (score !== undefined) point[project.id] = score;
    }
    return point;
  });
}

type EventRow = {
  id: string;
  fromStatus: ViolationStatus | null;
  toStatus: ViolationStatus;
  createdAt: Date;
  user: { name: string | null; email: string | null } | null;
  violation: { help: string; scanId: string };
};

type CommentRow = {
  id: string;
  body: string;
  createdAt: Date;
  user: { name: string | null; email: string | null } | null;
  violation: { help: string; scanId: string };
};

function buildActivity(
  events: EventRow[],
  comments: CommentRow[],
  scanContext: Map<string, { siteUrl: string; projectLabel: string }>,
): ProjectActivityItem[] {
  const items: ProjectActivityItem[] = [];

  for (const event of events) {
    const ctx = scanContext.get(event.violation.scanId);
    if (!ctx) continue;
    const from = event.fromStatus
      ? VIOLATION_STATUS_LABELS[event.fromStatus]
      : "Created";
    items.push({
      id: `event:${event.id}`,
      scanId: event.violation.scanId,
      projectLabel: ctx.projectLabel,
      pageUrl: ctx.siteUrl,
      help: event.violation.help,
      kind: "status",
      body: `${from} -> ${VIOLATION_STATUS_LABELS[event.toStatus]}`,
      actor: event.user?.name || event.user?.email || "System",
      createdAt: event.createdAt,
    });
  }

  for (const comment of comments) {
    const ctx = scanContext.get(comment.violation.scanId);
    if (!ctx) continue;
    items.push({
      id: `comment:${comment.id}`,
      scanId: comment.violation.scanId,
      projectLabel: ctx.projectLabel,
      pageUrl: ctx.siteUrl,
      help: comment.violation.help,
      kind: "comment",
      body: comment.body,
      actor: comment.user?.name || comment.user?.email || "Team",
      createdAt: comment.createdAt,
    });
  }

  return items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}
