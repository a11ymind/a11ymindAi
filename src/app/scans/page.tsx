import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { scoreBand } from "@/lib/score";
import { Logo } from "@/components/Logo";

export const dynamic = "force-dynamic";
export const metadata = { title: "Scan history — a11ymind AI" };

const PAGE_SIZE = 20;

type ScoreTone = "good" | "warn" | "bad";

const SCORE_COLOR: Record<ScoreTone, string> = {
  good: "#22c55e",
  warn: "#f59e0b",
  bad: "#ef4444",
};

type StatusKey = "COMPLETED" | "FAILED" | "PENDING" | "RUNNING";

const STATUS_STYLES: Record<StatusKey, { label: string; className: string }> = {
  COMPLETED: {
    label: "Completed",
    className: "bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/30",
  },
  FAILED: {
    label: "Failed",
    className: "bg-red-500/10 text-red-300 ring-1 ring-red-500/30",
  },
  PENDING: {
    label: "Pending",
    className: "bg-amber-500/10 text-amber-300 ring-1 ring-amber-500/30",
  },
  RUNNING: {
    label: "Running",
    className: "bg-amber-500/10 text-amber-300 ring-1 ring-amber-500/30",
  },
};

function statusStyle(status: string): { label: string; className: string } {
  if (status in STATUS_STYLES) {
    return STATUS_STYLES[status as StatusKey];
  }
  return {
    label: status,
    className: "bg-white/5 text-white/70 ring-1 ring-white/10",
  };
}

function relativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.max(0, Math.floor(diffMs / 1000));
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay}d ago`;
  const diffMonth = Math.floor(diffDay / 30);
  if (diffMonth < 12) return `${diffMonth}mo ago`;
  const diffYear = Math.floor(diffDay / 365);
  return `${diffYear}y ago`;
}

function truncateUrl(url: string, max = 64): string {
  if (url.length <= max) return url;
  return `${url.slice(0, max - 1)}…`;
}

function parsePage(raw: string | undefined, totalPages: number): number {
  const parsed = Number.parseInt(raw ?? "0", 10);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  if (parsed >= totalPages && totalPages > 0) return totalPages - 1;
  return parsed;
}

export default async function ScansPage({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string }>;
}) {
  const session = await getSession();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;
  const resolved = searchParams ? await searchParams : undefined;

  const total = await prisma.scan.count({ where: { userId } });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = parsePage(resolved?.page, totalPages);

  const scans = await prisma.scan.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: PAGE_SIZE,
    skip: page * PAGE_SIZE,
    select: {
      id: true,
      url: true,
      score: true,
      status: true,
      createdAt: true,
    },
  });

  const startIndex = total === 0 ? 0 : page * PAGE_SIZE + 1;
  const endIndex = Math.min(total, page * PAGE_SIZE + scans.length);
  const hasPrev = page > 0;
  const hasNext = page + 1 < totalPages;

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white">
      <header className="border-b border-white/5">
        <div className="container-page flex items-center justify-between py-5">
          <Link href="/" aria-label="a11ymind AI home" className="flex items-center">
            <Logo />
          </Link>
          <Link href="/dashboard" className="btn-ghost">
            Dashboard
          </Link>
        </div>
      </header>

      <main className="container-page py-12">
        <section className="mb-10 max-w-3xl">
          <p className="section-kicker">Scan history</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
            All past scans
          </h1>
          <p className="mt-4 text-base text-white/60">
            Every accessibility scan you have run, newest first. Open any report
            to revisit violations, AI-suggested fixes, and remediation progress.
          </p>
        </section>

        {scans.length === 0 ? (
          <div className="surface-premium card flex flex-col items-start gap-4 p-10">
            <div className="text-2xl font-medium">No scans yet</div>
            <p className="max-w-md text-white/60">
              No scans yet. Run your first scan to see results here.
            </p>
            <Link href="/" className="btn-primary mt-2">
              Run a scan
            </Link>
          </div>
        ) : (
          <>
            <div className="surface-premium card overflow-hidden p-0">
              <ul className="divide-y divide-white/5">
                {scans.map((scan) => {
                  const band = scoreBand(scan.score);
                  const status = statusStyle(scan.status);
                  const scoreColor = SCORE_COLOR[band.tone];
                  return (
                    <li
                      key={scan.id}
                      className="grid grid-cols-[auto_1fr_auto] items-center gap-x-6 gap-y-2 px-6 py-5 transition-colors hover:bg-white/[0.02] sm:grid-cols-[80px_1fr_140px_120px_auto]"
                    >
                      <div className="flex flex-col items-start sm:items-center">
                        <span
                          className="text-3xl font-semibold tabular-nums leading-none"
                          style={{ color: scoreColor }}
                          aria-label={`Score ${scan.score} out of 100, ${band.label}`}
                        >
                          {scan.score}
                        </span>
                        <span
                          className="mt-1 text-[10px] uppercase tracking-widest"
                          style={{ color: scoreColor }}
                        >
                          {band.label}
                        </span>
                      </div>

                      <div className="min-w-0">
                        <div className="truncate font-mono text-sm text-white/90">
                          {truncateUrl(scan.url)}
                        </div>
                        <div className="mt-1 text-xs text-white/40 sm:hidden">
                          {relativeTime(scan.createdAt)}
                        </div>
                      </div>

                      <div className="hidden sm:block">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${status.className}`}
                        >
                          {status.label}
                        </span>
                      </div>

                      <div className="hidden text-sm text-white/50 tabular-nums sm:block">
                        <time dateTime={scan.createdAt.toISOString()}>
                          {relativeTime(scan.createdAt)}
                        </time>
                      </div>

                      <div className="justify-self-end">
                        <Link
                          href={`/scan/${scan.id}`}
                          className="btn-ghost text-sm"
                          aria-label={`View report for ${scan.url}`}
                        >
                          View report
                          <span aria-hidden className="ml-1">→</span>
                        </Link>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            <nav
              className="mt-6 flex items-center justify-between gap-4"
              aria-label="Pagination"
            >
              <p className="text-sm text-white/50">
                Showing <span className="text-white/80">{startIndex}</span>–
                <span className="text-white/80">{endIndex}</span> of{" "}
                <span className="text-white/80">{total}</span>
              </p>
              <div className="flex items-center gap-2">
                {hasPrev ? (
                  <Link
                    href={`/scans?page=${page - 1}`}
                    className="btn-ghost text-sm"
                    rel="prev"
                  >
                    ← Previous
                  </Link>
                ) : (
                  <span
                    className="btn-ghost cursor-not-allowed text-sm opacity-40"
                    aria-disabled="true"
                  >
                    ← Previous
                  </span>
                )}
                <span className="chip text-xs">
                  Page {page + 1} of {totalPages}
                </span>
                {hasNext ? (
                  <Link
                    href={`/scans?page=${page + 1}`}
                    className="btn-primary text-sm"
                    rel="next"
                  >
                    Next →
                  </Link>
                ) : (
                  <span
                    className="btn-ghost cursor-not-allowed text-sm opacity-40"
                    aria-disabled="true"
                  >
                    Next →
                  </span>
                )}
              </div>
            </nav>
          </>
        )}
      </main>
    </div>
  );
}
