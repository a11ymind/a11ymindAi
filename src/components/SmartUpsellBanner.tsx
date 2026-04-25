import Link from "next/link";

type Variant = "critical" | "volume" | "progress" | "default";

export function SmartUpsellBanner({
  host,
  riskCount,
  criticalCount,
  seriousCount,
  hasPreviousScan,
}: {
  host: string;
  riskCount: number;
  criticalCount: number;
  seriousCount: number;
  hasPreviousScan: boolean;
}) {
  if (riskCount === 0 && !hasPreviousScan) return null;

  const variant: Variant =
    criticalCount > 0
      ? "critical"
      : riskCount >= 10
        ? "volume"
        : hasPreviousScan
          ? "progress"
          : "default";

  const copy = copyForVariant(variant, {
    host,
    riskCount,
    criticalCount,
    seriousCount,
  });

  return (
    <div className="rounded-2xl border border-accent/25 bg-accent/5 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div className="max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
            {copy.eyebrow}
          </p>
          <h2 className="mt-2 text-lg font-semibold text-text sm:text-xl">
            {copy.headline}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-text-muted">
            {copy.body}
          </p>
          <ul className="mt-4 grid gap-2 text-sm text-text sm:grid-cols-3">
            {copy.bullets.map((bullet) => (
              <li key={bullet} className="flex items-start gap-2">
                <span aria-hidden className="mt-1 h-1.5 w-1.5 rounded-full bg-accent" />
                <span className="text-text-muted">{bullet}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/pricing" className="btn-primary text-sm">
            Fix with AI — from $25/month
          </Link>
          <Link href="/pricing" className="btn-ghost text-sm">
            See all features
          </Link>
        </div>
      </div>
    </div>
  );
}

function copyForVariant(
  variant: Variant,
  {
    host,
    riskCount,
    criticalCount,
    seriousCount,
  }: { host: string; riskCount: number; criticalCount: number; seriousCount: number },
) {
  const site = host || "this page";

  if (variant === "critical") {
    return {
      eyebrow: "Critical risk detected",
      headline: `${criticalCount} critical issue${criticalCount === 1 ? "" : "s"} on ${site} — AI can write the fix.`,
      body: `Critical violations are the issues most likely to block real users. Unlock AI-written fixes for all ${riskCount} issues and stop guessing which selector changed.`,
      bullets: [
        "Plain-English explanation per issue",
        "Pasteable code fix with before/after",
        "WCAG context for every risk",
      ],
    };
  }

  if (variant === "volume") {
    return {
      eyebrow: "Ongoing monitoring",
      headline: `${riskCount} issues on ${site} — you'll want scheduled scans.`,
      body: `A single scan is a snapshot. Put this page on scheduled monitoring so new regressions get flagged when they ship, not after a customer or client finds them.`,
      bullets: [
        "Weekly auto-scan + email alerts",
        "AI fixes (100 / month on Starter)",
        "Shareable PDF report for clients",
      ],
    };
  }

  if (variant === "progress") {
    return {
      eyebrow: "Track progress",
      headline: `Keep watching ${site} — one scan won't catch regressions.`,
      body: `You've scanned this page before. Saving it monitors changes over time and flags when a new violation lands on the page.`,
      bullets: [
        "Score history across scans",
        "Alerts when new risks appear",
        "AI fixes for every new issue",
      ],
    };
  }

  return {
    eyebrow: "Next step",
    headline: `${riskCount} issue${riskCount === 1 ? "" : "s"} on ${site} — AI fixes are ready.`,
    body: `Unlock plain-English explanations and pasteable code fixes for every ${seriousCount > 0 ? "serious and" : ""} moderate risk on this page.`,
    bullets: [
      "AI fix per violation",
      "PDF report + shareable link",
      "Weekly auto-scan included",
    ],
  };
}
