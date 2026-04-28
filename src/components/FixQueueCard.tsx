import Link from "next/link";
import type { ViolationStatus } from "@prisma/client";
import {
  VIOLATION_STATUS_LABELS,
  VIOLATION_STATUS_OPTIONS,
} from "@/lib/violation-status";
import {
  formatRelative,
  normalizeImpact,
  severityColor,
} from "@/lib/dashboard-format";

export type FixQueueItem = {
  id: string;
  scanId: string;
  pageUrl: string;
  projectLabel: string;
  help: string;
  impact: string;
  status: ViolationStatus;
  statusUpdatedAt: Date | null;
};

export type WorkflowOverview = {
  statusCounts: Record<ViolationStatus, number>;
  needsVerification: FixQueueItem[];
};

export function FixQueueCard({
  items,
  overview,
  itemLimit = 8,
}: {
  items: FixQueueItem[];
  overview: WorkflowOverview;
  itemLimit?: number;
}) {
  const openCount = items.filter((item) => item.status === "OPEN").length;
  const inProgressCount = items.filter((item) => item.status === "IN_PROGRESS").length;

  return (
    <div className="premium-panel overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 px-6 py-5">
        <div>
          <p className="section-kicker">Fix queue</p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-text">
            Critical and serious issues needing action
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-text-muted">
            This queue turns scan results into a workflow: open, in progress, fixed, verified, or ignored.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-text-subtle">
          {VIOLATION_STATUS_OPTIONS.map((status) => (
            <span
              key={status}
              className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-text-subtle"
            >
              {overview.statusCounts[status]} {VIOLATION_STATUS_LABELS[status].toLowerCase()}
            </span>
          ))}
        </div>
      </div>
      <div className="grid border-b border-white/10 bg-bg/35 md:grid-cols-3">
        <div className="px-6 py-4">
          <p className="text-[10px] uppercase tracking-[0.18em] text-text-subtle">Open</p>
          <p className="mt-1 text-2xl font-semibold text-severity-critical">{openCount}</p>
        </div>
        <div className="border-white/10 px-6 py-4 md:border-l">
          <p className="text-[10px] uppercase tracking-[0.18em] text-text-subtle">In progress</p>
          <p className="mt-1 text-2xl font-semibold text-accent">{inProgressCount}</p>
        </div>
        <div className="border-white/10 px-6 py-4 md:border-l">
          <p className="text-[10px] uppercase tracking-[0.18em] text-text-subtle">Needs verification</p>
          <p className="mt-1 text-2xl font-semibold text-severity-moderate">
            {overview.needsVerification.length}
          </p>
        </div>
      </div>
      {overview.needsVerification.length > 0 ? (
        <div className="border-b border-white/10 px-6 py-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-text">Ready to verify</p>
              <p className="mt-1 text-xs text-text-muted">
                These issues are marked fixed. Re-scan the page to confirm they disappear.
              </p>
            </div>
          </div>
          <div className="mt-4 grid gap-2">
            {overview.needsVerification.slice(0, 4).map((item) => (
              <Link
                key={item.id}
                href={`/scan/${item.scanId}?status=FIXED#impact-${normalizeImpact(item.impact)}`}
                className="grid gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 transition-colors hover:border-severity-moderate/40 sm:grid-cols-[1fr_auto] sm:items-center"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-text">{item.help}</span>
                  <span className="mt-1 block truncate text-xs text-text-muted">
                    {item.projectLabel} · {item.pageUrl}
                  </span>
                </span>
                <span className="text-xs text-severity-moderate">
                  {item.statusUpdatedAt ? `Marked fixed ${formatRelative(item.statusUpdatedAt)}` : "Marked fixed"}
                </span>
              </Link>
            ))}
          </div>
        </div>
      ) : null}
      {items.length > 0 ? (
        <div className="divide-y divide-white/10">
          {items.slice(0, itemLimit).map((item) => (
            <div key={item.id} className="grid gap-3 px-6 py-4 lg:grid-cols-[1fr_auto] lg:items-center">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className="rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.18em]"
                    style={{
                      borderColor: `${severityColor(item.impact)}55`,
                      color: severityColor(item.impact),
                      backgroundColor: `${severityColor(item.impact)}18`,
                    }}
                  >
                    {item.impact || "minor"}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-text-subtle">
                    {VIOLATION_STATUS_LABELS[item.status]}
                  </span>
                </div>
                <p className="mt-2 truncate text-sm font-semibold text-text">{item.help}</p>
                <p className="mt-1 truncate text-xs text-text-muted">
                  {item.projectLabel} · {item.pageUrl}
                </p>
              </div>
              <Link href={`/scan/${item.scanId}#impact-${normalizeImpact(item.impact)}`} className="btn-ghost text-sm">
                Work issue
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <div className="px-6 py-8">
          <p className="text-sm font-medium text-text">No critical or serious open issues right now.</p>
          <p className="mt-1 text-sm text-text-muted">
            New scan findings will appear here when they need review.
          </p>
        </div>
      )}
    </div>
  );
}
