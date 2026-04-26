import { CiTokenSnippet } from "@/components/CiTokenSnippet";

type CiCheckItem = {
  id: string;
  source: string;
  status: string;
  score: number | null;
  criticalCount: number;
  seriousCount: number;
  moderateCount: number;
  minorCount: number;
  branch: string | null;
  commitSha: string | null;
  environment: string | null;
  runUrl: string | null;
  reportUrl: string | null;
  createdAt: Date;
};

export function CiHistoryCard({
  siteId,
  siteUrl,
  endpoint,
  token,
  checks,
  compact = false,
}: {
  siteId: string;
  siteUrl: string;
  endpoint: string;
  token: string;
  checks: CiCheckItem[];
  compact?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-text-subtle">
            CI check history
          </p>
          {!compact && (
            <p className="mt-1 text-sm text-text">
              Store AccessLint or pipeline results for the {siteUrl} website project in your dashboard.
            </p>
          )}
          <p className="mt-1 text-xs text-text-muted">
            Use the project ingest token below from GitHub Actions or any CI job.
            If it ever leaks, rotate it — the old value stops working immediately.
          </p>
        </div>
      </div>

      <div className="mt-4">
        <CiTokenSnippet siteId={siteId} endpoint={endpoint} initialToken={token} />
      </div>

      <div className="mt-4 space-y-3">
        {checks.length > 0 ? (
          checks.slice(0, compact ? 2 : checks.length).map((check) => (
            <div key={check.id} className="rounded-xl border border-white/10 bg-bg/70 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] ${
                      check.status === "passed"
                        ? "border-accent/20 bg-accent/10 text-accent"
                        : "border-severity-critical/30 bg-severity-critical/10 text-severity-critical"
                    }`}
                  >
                    {check.status}
                  </span>
                  <span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-text-subtle">
                    {check.source}
                  </span>
                  {check.environment ? (
                    <span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-text-subtle">
                      {check.environment}
                    </span>
                  ) : null}
                </div>
                <p className="text-xs text-text-subtle">{formatRelative(check.createdAt)}</p>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-text">
                <span>Score: {check.score ?? "—"}</span>
                <span>Critical: {check.criticalCount}</span>
                <span>Serious: {check.seriousCount}</span>
                <span>Moderate: {check.moderateCount}</span>
                <span>Minor: {check.minorCount}</span>
              </div>
              {(check.branch || check.commitSha || check.runUrl || check.reportUrl) && (
                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-text-muted">
                  {check.branch ? <span>Branch: {check.branch}</span> : null}
                  {check.commitSha ? <span>Commit: {check.commitSha.slice(0, 8)}</span> : null}
                  {check.runUrl ? (
                    <a href={check.runUrl} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                      Workflow run →
                    </a>
                  ) : null}
                  {check.reportUrl ? (
                    <a href={check.reportUrl} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                      Report →
                    </a>
                  ) : null}
                </div>
              )}
            </div>
          ))
        ) : (
          <p className="rounded-xl border border-white/10 bg-bg/60 p-4 text-sm text-text-muted">
            No CI checks have been posted for this website project yet.
          </p>
        )}
      </div>
    </div>
  );
}

function formatRelative(date: Date) {
  const diff = Date.now() - date.getTime();
  const min = 60_000;
  const hour = 60 * min;
  const day = 24 * hour;
  if (diff < hour) return `${Math.max(1, Math.round(diff / min))}m ago`;
  if (diff < day) return `${Math.round(diff / hour)}h ago`;
  if (diff < 14 * day) return `${Math.round(diff / day)}d ago`;
  return date.toLocaleDateString();
}
