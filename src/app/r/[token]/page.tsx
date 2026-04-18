import Link from "next/link";
import { notFound } from "next/navigation";
import { Logo } from "@/components/Logo";
import { prisma } from "@/lib/prisma";
import { scoreBand } from "@/lib/score";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Shared accessibility report — Accessly",
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
  params: { token: string };
}) {
  const scan = await prisma.scan.findUnique({
    where: { shareToken: params.token },
    include: {
      violations: {
        select: {
          id: true,
          axeId: true,
          impact: true,
          help: true,
          description: true,
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
    <main className="min-h-screen">
      <header className="container-page flex items-center justify-between py-6">
        <Link href="/">
          <Logo />
        </Link>
        <Link href="/" className="btn-primary text-sm">
          Scan your own site
        </Link>
      </header>

      <section className="container-page mt-4">
        <div className="card p-8">
          <p className="text-xs uppercase tracking-wider text-text-subtle">
            Shared accessibility report
          </p>
          <p className="mt-2 break-all font-mono text-sm text-text">{scan.url}</p>
          <p className="mt-2 text-xs text-text-subtle">
            Scanned {new Date(scan.createdAt).toLocaleDateString()} ·{" "}
            {scan.violations.length} risk
            {scan.violations.length === 1 ? "" : "s"}
          </p>
          <div className="mt-6 flex items-center gap-6">
            <div>
              <p
                className="text-5xl font-semibold tabular-nums"
                style={{ color: bandColor(band.tone) }}
              >
                {scan.score}
              </p>
              <p className="text-sm text-text-subtle">out of 100 · {band.label}</p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {IMPACT_ORDER.map((impact) => (
                <div
                  key={impact}
                  className="rounded-md border border-border px-3 py-2"
                >
                  <span
                    className="mr-2 inline-block h-2 w-2 rounded-full align-middle"
                    style={{ backgroundColor: severityColor(impact) }}
                  />
                  {IMPACT_LABELS[impact]}:{" "}
                  <strong>{grouped.get(impact)?.length ?? 0}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="container-page mt-8 space-y-6 pb-24">
        {IMPACT_ORDER.map((impact) => {
          const items = grouped.get(impact) ?? [];
          if (items.length === 0) return null;
          return (
            <div key={impact}>
              <h2 className="mb-3 text-lg font-semibold">
                <span
                  className="mr-2 inline-block h-2 w-2 rounded-full align-middle"
                  style={{ backgroundColor: severityColor(impact) }}
                />
                {IMPACT_LABELS[impact]}
                <span className="ml-2 text-sm font-normal text-text-muted">
                  ({items.length})
                </span>
              </h2>
              <div className="space-y-3">
                {items.map((v) => (
                  <div
                    key={v.id}
                    className="rounded-xl border border-border bg-bg-muted/40 p-4"
                  >
                    <p className="text-sm font-semibold text-text">{v.help}</p>
                    <p className="mt-1 text-sm text-text-muted">
                      {v.description}
                    </p>
                    <p className="mt-1 font-mono text-xs text-text-subtle">
                      {v.axeId}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        <div className="card mt-8 flex flex-col items-start gap-2 p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-text-muted">
            Want to check your own site? Accessly scans any URL in seconds.
          </p>
          <Link href="/" className="btn-primary text-sm">
            Run a free scan
          </Link>
        </div>
      </section>
    </main>
  );
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
