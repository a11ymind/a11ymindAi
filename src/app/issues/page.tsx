import { redirect } from "next/navigation";
import type { ViolationStatus } from "@prisma/client";
import { AppHeader } from "@/components/AppHeader";
import {
  FixQueueCard,
  type FixQueueItem,
  type WorkflowOverview,
} from "@/components/FixQueueCard";
import { SiteFooter } from "@/components/SiteFooter";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hostOf, normalizeImpact, originOf } from "@/lib/dashboard-format";
import {
  isActionableViolationStatus,
  VIOLATION_STATUS_OPTIONS,
} from "@/lib/violation-status";

export const dynamic = "force-dynamic";
export const metadata = { title: "Issues — a11ymind AI" };

const IMPACT_RANK: Record<string, number> = {
  critical: 0,
  serious: 1,
  moderate: 2,
  minor: 3,
};
const STATUS_RANK: Record<ViolationStatus, number> = {
  OPEN: 0,
  IN_PROGRESS: 1,
  IGNORED: 2,
  FIXED: 3,
  VERIFIED: 4,
};

export default async function IssuesPage() {
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, plan: true },
  });
  if (!user) redirect("/login");

  // Fetch sites just to derive label + the latest completed scan per page.
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

  const latestScanIds: string[] = [];
  const scanContext = new Map<string, { siteUrl: string; projectLabel: string }>();
  for (const site of sites) {
    const latestScan = site.scans[0];
    if (!latestScan) continue;
    latestScanIds.push(latestScan.id);
    const projectLabel =
      site.project?.name || hostOf(site.project?.origin ?? originOf(site.url));
    scanContext.set(latestScan.id, { siteUrl: site.url, projectLabel });
  }

  const violations = latestScanIds.length
    ? await prisma.violation.findMany({
        where: { scanId: { in: latestScanIds } },
        select: {
          id: true,
          axeId: true,
          impact: true,
          help: true,
          status: true,
          statusUpdatedAt: true,
          scanId: true,
        },
      })
    : [];

  const queueItems: FixQueueItem[] = [];
  const needsVerification: FixQueueItem[] = [];
  const statusCounts = Object.fromEntries(
    VIOLATION_STATUS_OPTIONS.map((status) => [status, 0]),
  ) as Record<ViolationStatus, number>;

  for (const v of violations) {
    statusCounts[v.status] += 1;
    const ctx = scanContext.get(v.scanId);
    if (!ctx) continue;
    const item: FixQueueItem = {
      id: v.id,
      scanId: v.scanId,
      pageUrl: ctx.siteUrl,
      projectLabel: ctx.projectLabel,
      help: v.help,
      impact: v.impact,
      status: v.status,
      statusUpdatedAt: v.statusUpdatedAt,
    };
    const impact = normalizeImpact(v.impact);
    if (
      (impact === "critical" || impact === "serious") &&
      isActionableViolationStatus(v.status)
    ) {
      queueItems.push(item);
    }
    if (v.status === "FIXED") {
      needsVerification.push(item);
    }
  }

  queueItems.sort((a, b) => {
    const impactDelta =
      IMPACT_RANK[normalizeImpact(a.impact)] - IMPACT_RANK[normalizeImpact(b.impact)];
    if (impactDelta !== 0) return impactDelta;
    return STATUS_RANK[a.status] - STATUS_RANK[b.status];
  });
  needsVerification.sort((a, b) => {
    const left = a.statusUpdatedAt?.getTime() ?? 0;
    const right = b.statusUpdatedAt?.getTime() ?? 0;
    return right - left;
  });

  const overview: WorkflowOverview = { statusCounts, needsVerification };

  return (
    <>
      <AppHeader user={user} active="issues" />
      <main id="main" className="page-shell-gradient min-h-screen">
        <section className="container-page mt-8">
          <p className="section-kicker">Issues</p>
          <h1 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-text sm:text-4xl">
            Work the queue, not the report
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-text-muted">
            Critical and serious findings from the latest scan of every monitored page, ordered by impact and status. Open
            an issue to leave comments, assign a teammate, or change its status.
          </p>
        </section>
        <section className="container-page mt-8 pb-16">
          <FixQueueCard items={queueItems} overview={overview} itemLimit={50} />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
