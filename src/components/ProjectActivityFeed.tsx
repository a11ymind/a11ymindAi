import Link from "next/link";
import { formatRelative } from "@/lib/dashboard-format";

export type ProjectActivityItem = {
  id: string;
  scanId: string;
  projectLabel: string;
  pageUrl: string;
  help: string;
  kind: "status" | "comment";
  body: string;
  actor: string;
  createdAt: Date;
};

export function ProjectActivityFeed({
  items,
  itemLimit = 10,
}: {
  items: ProjectActivityItem[];
  itemLimit?: number;
}) {
  return (
    <div className="premium-panel overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 px-6 py-5">
        <div>
          <p className="section-kicker">Project activity</p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-text">
            Latest workflow updates across monitored pages
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-text-muted">
            Status changes and comments from the latest scans, so you can see movement, not just scores.
          </p>
        </div>
      </div>
      {items.length > 0 ? (
        <div className="divide-y divide-white/10">
          {items.slice(0, itemLimit).map((item) => (
            <Link
              key={item.id}
              href={`/scan/${item.scanId}`}
              className="grid gap-3 px-6 py-4 transition-colors hover:bg-white/[0.03] sm:grid-cols-[auto_1fr_auto] sm:items-center"
            >
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-text-subtle">
                {item.kind}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-text">{item.body}</span>
                <span className="mt-1 block truncate text-xs text-text-muted">
                  {item.projectLabel} · {item.pageUrl} · {item.help}
                </span>
              </span>
              <span className="text-xs text-text-subtle">
                {item.actor} · {formatRelative(item.createdAt)}
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="px-6 py-8">
          <p className="text-sm font-medium text-text">No workflow activity yet.</p>
          <p className="mt-1 text-sm text-text-muted">
            Comments and status changes will appear here once you start working issues.
          </p>
        </div>
      )}
    </div>
  );
}
