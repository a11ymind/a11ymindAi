import Link from "next/link";
import { notFound } from "next/navigation";
import { Logo } from "@/components/Logo";
import { prisma } from "@/lib/prisma";
import { scoreBand } from "@/lib/score";
import { VIOLATION_STATUS_LABELS } from "@/lib/violation-status";

// A shared scan's content is effectively immutable once the scan completes,
// so let Vercel's CDN cache the rendered page for 5 minutes. On revoke we
// render 404; worst-case a revoked token stays viewable for up to 5 min.
export const revalidate = 300;
export const metadata = {
  title: "Shared accessibility report — A11ymindAi",
  robots: { index: false, follow: false },
};

type Impact = "critical" | "serious" | "moderate" | "minor";
const IMPACT_ORDER: Impact[] = ["critical", "serious", "moderate", "minor"];
const IMPACT_LABELS: Record<Impact, string> = {
  critical: "Critical",
  serious: "Serious",
  moderate: "Moderate",
  minor: "Minor",
};

export default async function SharedReportPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const scan = await prisma.scan.findUnique({
    where: { shareToken: token },
    include: {
      violations: {
        select: {
          id: true,
          axeId: true,
          impact: true,
          help: true,
          description: true,
          selector: true,
          element: true,
          failureSummary: true,
          status: true,
          statusUpdatedAt: true,
          assigneeName: true,
          assigneeEmail: true,
          assignee: {
            select: {
              name: true,
              email: true,
            },
          },
          assignedAt: true,
          comments: {
            orderBy: { createdAt: "desc" },
            take: 3,
            select: {
              id: true,
              body: true,
              createdAt: true,
              user: { select: { name: true, email: true } },
            },
          },
          events: {
            orderBy: { createdAt: "desc" },
            take: 3,
            select: {
              id: true,
              fromStatus: true,
              toStatus: true,
              note: true,
              createdAt: true,
              user: { select: { name: true, email: true } },
            },
          },
          instances: {
            orderBy: { ordinal: "asc" },
            select: {
              id: true,
              ordinal: true,
              selector: true,
              element: true,
              failureSummary: true,
            },
          },
        },
      },
    },
  });

  if (!scan || scan.status !== "COMPLETED") notFound();

  const band = scoreBand(scan.score);
  const grouped = new Map<Impact, typeof scan.violations>();
  for (const impact of IMPACT_ORDER) grouped.set(impact, []);
  for (const v of scan.violations) {
    const impact = (v.impact as Impact) || "minor";
    grouped.get(impact)?.push(v);
  }

  return (
    <main className="page-shell-gradient min-h-screen">
      <header className="container-page flex items-center justify-between py-6">
        <Link href="/">
          <Logo />
        </Link>
        <Link href="/" className="btn-primary text-sm">
          Scan your own page
        </Link>
      </header>

      <section className="container-page mt-4">
        <div className="surface-premium rounded-[1.8rem]">
          <div className="grid gap-8 px-6 py-8 sm:px-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div className="min-w-0">
              <p className="section-kicker">Shared accessibility report</p>
              <p className="mt-3 break-all font-mono text-sm text-text-muted">{scan.url}</p>
              <h1 className="mt-5 max-w-3xl text-balance text-3xl font-semibold tracking-[-0.03em] text-text sm:text-5xl">
                {scan.violations.length === 0
                  ? "No automated accessibility risks were detected."
                  : `${scan.violations.length} accessibility risk${scan.violations.length === 1 ? "" : "s"} need review.`}
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-text-muted sm:text-base">
                This read-only report summarizes automated WCAG findings, affected page locations,
                and priority severity so teams can act without opening the dashboard.
              </p>
              <div className="mt-6 flex flex-wrap gap-2 text-xs text-text-subtle">
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">
                  Scanned {new Date(scan.createdAt).toLocaleDateString()}
                </span>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">
                  1 page scanned
                </span>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">
                  Read-only share link
                </span>
              </div>
            </div>
            <SharedScorePanel score={scan.score} band={band} />
          </div>
          <div className="grid gap-px border-t border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
            {IMPACT_ORDER.map((impact) => (
              <SharedMetric
                key={impact}
                label={IMPACT_LABELS[impact]}
                value={`${grouped.get(impact)?.length ?? 0}`}
                color={severityColor(impact)}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="container-page mt-8">
        <div className="rounded-[1.5rem] border border-white/10 bg-bg-elevated/45 p-5 shadow-card">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="section-kicker">How to use this report</p>
              <p className="mt-2 text-sm text-text-muted">
                Start with critical and serious items, copy the affected selectors, then re-scan after fixes ship.
              </p>
            </div>
            <Link href="/" className="btn-ghost text-sm">
              Scan another URL
            </Link>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <GuidanceStep label="1" title="Prioritize" body="Resolve critical and serious issues first." />
            <GuidanceStep label="2" title="Locate" body="Use selectors and HTML snippets to find failing code." />
            <GuidanceStep label="3" title="Verify" body="Re-scan after deployment to catch regressions." />
          </div>
        </div>
      </section>

      {scan.violations.length > 0 && (
        <section className="container-page mt-8">
          <div className="sticky top-0 z-10 -mx-1 flex flex-wrap gap-2 bg-bg/85 px-1 py-3 backdrop-blur">
            {IMPACT_ORDER.map((impact) => {
              const count = grouped.get(impact)?.length ?? 0;
              if (count === 0) return null;
              return (
                <a
                  key={impact}
                  href={`#shared-impact-${impact}`}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-bg-muted/60 px-3 py-1 text-xs text-text hover:border-accent-muted"
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: severityColor(impact) }}
                  />
                  {IMPACT_LABELS[impact]}
                  <span className="tabular-nums text-text-subtle">{count}</span>
                </a>
              );
            })}
          </div>
        </section>
      )}

      <section className="container-page mt-6 space-y-8 pb-24">
        {scan.violations.length === 0 && (
          <div className="card p-10 text-center">
            <h2 className="text-2xl font-semibold text-text">No WCAG violations found</h2>
            <p className="mx-auto mt-2 max-w-2xl text-sm text-text-muted">
              Automated testing did not flag failures on this page. Manual keyboard and screen-reader testing is still recommended for full confidence.
            </p>
          </div>
        )}

        {IMPACT_ORDER.map((impact) => {
          const items = grouped.get(impact) ?? [];
          if (items.length === 0) return null;
          return (
            <div key={impact} id={`shared-impact-${impact}`}>
              <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="section-kicker">{IMPACT_LABELS[impact]} findings</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-text">
                    {items.length} issue{items.length === 1 ? "" : "s"} to review
                  </h2>
                </div>
                <span
                  className="rounded-full border px-3 py-1 text-xs"
                  style={{
                    borderColor: `${severityColor(impact)}55`,
                    color: severityColor(impact),
                    backgroundColor: `${severityColor(impact)}18`,
                  }}
                >
                  {IMPACT_LABELS[impact]}
                </span>
              </div>
              <div className="space-y-3">
                {items.map((v) => (
                  <div
                    key={v.id}
                    className="overflow-hidden rounded-2xl border border-white/10 bg-bg-elevated/45 shadow-card"
                  >
                    <div className="grid gap-4 p-5 md:grid-cols-[1fr_auto]">
                      <div>
                        <p className="text-base font-semibold text-text">{v.help}</p>
                        <p className="mt-2 text-sm leading-relaxed text-text-muted">
                          {v.description}
                        </p>
                        <p className="mt-3 font-mono text-xs text-text-subtle">
                          {v.axeId}
                        </p>
                        <SharedWorkflowContext violation={v} />
                      </div>
                      <div className="rounded-xl border border-white/10 bg-bg/60 px-4 py-3 text-sm text-text-muted md:min-w-36">
                        <p className="text-[10px] uppercase tracking-[0.18em] text-text-subtle">
                          Locations
                        </p>
                        <p className="mt-1 text-2xl font-semibold text-text">
                          {affectedLocationCount(v)}
                        </p>
                      </div>
                    </div>
                    <SharedAffectedLocations violation={v} />
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        <div className="surface-premium rounded-[1.5rem] px-6 py-6 sm:flex sm:items-center sm:justify-between sm:gap-6">
          <div>
            <p className="section-kicker">Turn reports into monitoring</p>
            <h2 className="mt-2 text-xl font-semibold text-text">
              Want to check your own page?
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-text-muted">
              A11ymindAi scans public URLs, tracks regressions, and helps teams share fixes people can actually act on.
            </p>
          </div>
          <Link href="/" className="btn-primary mt-5 text-sm sm:mt-0">
            Run a free scan
          </Link>
        </div>
      </section>
    </main>
  );
}

function SharedAffectedLocations({
  violation,
}: {
  violation: {
    id: string;
    selector: string;
    element: string;
    failureSummary: string | null;
    instances: {
      id: string;
      ordinal: number;
      selector: string;
      element: string;
      failureSummary: string | null;
    }[];
  };
}) {
  const locations =
    violation.instances.length > 0
      ? violation.instances
      : violation.selector || violation.element || violation.failureSummary
        ? [
            {
              id: `${violation.id}-legacy-location`,
              ordinal: 0,
              selector: violation.selector,
              element: violation.element,
              failureSummary: violation.failureSummary,
            },
          ]
        : [];

  if (locations.length === 0) return null;

  return (
    <details className="border-t border-white/10 bg-bg/35 px-5 py-4">
      <summary className="cursor-pointer text-xs font-medium text-accent">
        Show {locations.length} affected location{locations.length === 1 ? "" : "s"}
      </summary>
      <div className="mt-3 space-y-3">
        {locations.map((location, index) => (
          <div key={location.id} className="rounded-xl border border-white/10 bg-bg-muted/40 p-3">
            <p className="text-[10px] uppercase tracking-[0.18em] text-text-subtle">
              Location {index + 1}
            </p>
            <code className="mt-2 block overflow-x-auto rounded-md border border-border bg-bg p-2 font-mono text-xs text-text">
              {location.selector || "(no selector)"}
            </code>
            {location.failureSummary && (
              <pre className="mt-2 whitespace-pre-wrap rounded-md border border-border bg-bg p-2 font-mono text-xs text-text-subtle">
                {location.failureSummary}
              </pre>
            )}
            {location.element && (
              <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-all rounded-md border border-border bg-bg p-2 font-mono text-xs text-text-muted">
                {location.element}
              </pre>
            )}
          </div>
        ))}
      </div>
    </details>
  );
}

function SharedWorkflowContext({
  violation,
}: {
  violation: {
    status: keyof typeof VIOLATION_STATUS_LABELS;
    statusUpdatedAt: Date | null;
    assigneeName: string | null;
    assigneeEmail: string | null;
    assignee: { name: string | null; email: string } | null;
    assignedAt: Date | null;
    comments: {
      id: string;
      body: string;
      createdAt: Date;
      user: { name: string | null; email: string | null } | null;
    }[];
    events: {
      id: string;
      fromStatus: keyof typeof VIOLATION_STATUS_LABELS | null;
      toStatus: keyof typeof VIOLATION_STATUS_LABELS;
      note: string | null;
      createdAt: Date;
      user: { name: string | null; email: string | null } | null;
    }[];
  };
}) {
  const assignee = violation.assignee?.name || violation.assigneeName || violation.assignee?.email || violation.assigneeEmail;

  return (
    <div className="mt-4 grid gap-3 lg:grid-cols-3">
      <div className="rounded-xl border border-white/10 bg-bg/45 p-3">
        <p className="text-[10px] uppercase tracking-[0.18em] text-text-subtle">Status</p>
        <p className="mt-2 text-sm font-medium text-text">
          {VIOLATION_STATUS_LABELS[violation.status]}
        </p>
        {violation.statusUpdatedAt ? (
          <p className="mt-1 text-xs text-text-subtle">
            Updated {formatRelative(violation.statusUpdatedAt)}
          </p>
        ) : null}
      </div>
      <div className="rounded-xl border border-white/10 bg-bg/45 p-3">
        <p className="text-[10px] uppercase tracking-[0.18em] text-text-subtle">Assignee</p>
        <p className="mt-2 text-sm font-medium text-text">
          {assignee || "Unassigned"}
        </p>
        {(violation.assignee?.email || violation.assigneeEmail) && assignee ? (
          <p className="mt-1 text-xs text-text-muted">
            {violation.assignee?.email || violation.assigneeEmail}
          </p>
        ) : null}
        {violation.assignedAt ? (
          <p className="mt-1 text-xs text-text-subtle">
            Assigned {formatRelative(violation.assignedAt)}
          </p>
        ) : null}
      </div>
      <div className="rounded-xl border border-white/10 bg-bg/45 p-3">
        <p className="text-[10px] uppercase tracking-[0.18em] text-text-subtle">Latest activity</p>
        {violation.events[0] ? (
          <p className="mt-2 text-sm text-text-muted">
            {VIOLATION_STATUS_LABELS[violation.events[0].toStatus]} · {formatRelative(violation.events[0].createdAt)}
          </p>
        ) : (
          <p className="mt-2 text-sm text-text-muted">No workflow updates yet.</p>
        )}
      </div>
      {violation.comments.length > 0 ? (
        <div className="rounded-xl border border-white/10 bg-bg/45 p-3 lg:col-span-3">
          <p className="text-[10px] uppercase tracking-[0.18em] text-text-subtle">Team notes</p>
          <div className="mt-3 grid gap-2">
            {violation.comments.map((comment) => (
              <div key={comment.id} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <p className="text-xs text-text-subtle">
                  {comment.user?.name || comment.user?.email || "Team"} · {formatRelative(comment.createdAt)}
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-text-muted">{comment.body}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SharedScorePanel({
  score,
  band,
}: {
  score: number;
  band: { label: string; tone: "good" | "warn" | "bad" };
}) {
  const color = bandColor(band.tone);
  return (
    <div className="rounded-[1.4rem] border border-white/10 bg-bg/55 p-5 text-center shadow-card lg:min-w-56">
      <div
        className="mx-auto grid h-28 w-28 place-items-center rounded-full p-1"
        style={{
          background: `conic-gradient(${color} ${score * 3.6}deg, rgba(255,255,255,0.08) 0deg)`,
        }}
      >
        <div className="grid h-full w-full place-items-center rounded-full border border-white/10 bg-bg">
          <div>
            <p className="text-4xl font-semibold tabular-nums text-text">{score}</p>
            <p className="text-[10px] uppercase tracking-[0.16em] text-text-subtle">Score</p>
          </div>
        </div>
      </div>
      <p className="mt-4 text-sm font-semibold" style={{ color }}>
        {band.label}
      </p>
      <p className="mt-1 text-xs text-text-subtle">Automated score out of 100</p>
    </div>
  );
}

function SharedMetric({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="bg-bg/70 p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs uppercase tracking-wider text-text-subtle">{label}</p>
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      </div>
      <p className="mt-2 text-2xl font-semibold text-text">{value}</p>
    </div>
  );
}

function GuidanceStep({
  label,
  title,
  body,
}: {
  label: string;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-bg/55 p-4">
      <div className="flex items-center gap-3">
        <span className="grid h-7 w-7 place-items-center rounded-full border border-accent/30 bg-accent/10 text-xs font-semibold text-accent">
          {label}
        </span>
        <p className="font-semibold text-text">{title}</p>
      </div>
      <p className="mt-3 text-sm text-text-muted">{body}</p>
    </div>
  );
}

function affectedLocationCount(violation: {
  selector: string;
  element: string;
  failureSummary: string | null;
  instances: unknown[];
}) {
  if (violation.instances.length > 0) return violation.instances.length;
  return violation.selector || violation.element || violation.failureSummary ? 1 : 0;
}

function severityColor(impact: Impact): string {
  return {
    critical: "#ef4444",
    serious: "#f97316",
    moderate: "#eab308",
    minor: "#3b82f6",
  }[impact];
}

function bandColor(tone: "good" | "warn" | "bad"): string {
  return tone === "good" ? "#22c55e" : tone === "warn" ? "#f59e0b" : "#ef4444";
}

function formatRelative(date: Date): string {
  const diff = Date.now() - date.getTime();
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diff < minute) return "just now";
  if (diff < hour) return `${Math.floor(diff / minute)}m ago`;
  if (diff < day) return `${Math.floor(diff / hour)}h ago`;
  return `${Math.floor(diff / day)}d ago`;
}
