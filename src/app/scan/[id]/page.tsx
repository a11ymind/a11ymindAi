import Link from "next/link";
import { notFound } from "next/navigation";
import { Logo } from "@/components/Logo";
import { prisma } from "@/lib/prisma";
import { scoreBand } from "@/lib/score";
import { getSession } from "@/lib/auth";
import {
  entitlementsFor,
  planLabel,
  savedSiteLimitMessage,
} from "@/lib/entitlements";

export const dynamic = "force-dynamic";

type Impact = "critical" | "serious" | "moderate" | "minor";
const IMPACT_ORDER: Impact[] = ["critical", "serious", "moderate", "minor"];
const IMPACT_LABELS: Record<Impact, string> = {
  critical: "Critical",
  serious: "Serious",
  moderate: "Moderate",
  minor: "Minor",
};
const IMPACT_COPY: Record<Impact, string> = {
  critical: "Blocks assistive-tech users entirely. Highest ADA Title III exposure.",
  serious: "Significantly impairs users with disabilities.",
  moderate: "Causes confusion or friction for some users.",
  minor: "Best-practice gaps that improve overall quality.",
};

export default async function ScanResultPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: {
    limit?: string;
    plan?: string;
    pdf?: string;
    aiEnabled?: string;
    requiresLoginForAI?: string;
    requiresUpgradeForAI?: string;
    aiLimitReached?: string;
  };
}) {
  const [scan, session] = await Promise.all([
    prisma.scan.findUnique({
      where: { id: params.id },
      include: {
        violations: true,
        user: { select: { plan: true } },
      },
    }),
    getSession(),
  ]);
  if (!scan) notFound();

  if (scan.status === "FAILED") {
    return (
      <PageShell>
        <div className="card mx-auto mt-20 max-w-xl p-8 text-center">
          <h1 className="text-xl font-semibold">We couldn&apos;t scan that URL.</h1>
          <p className="mt-2 text-sm text-text-muted">{scan.error || "Unknown error."}</p>
          <Link href="/" className="btn-primary mt-6">
            Try another URL
          </Link>
        </div>
      </PageShell>
    );
  }

  const grouped = new Map<Impact, typeof scan.violations>();
  for (const impact of IMPACT_ORDER) grouped.set(impact, []);
  for (const v of scan.violations) {
    const impact = (v.impact as Impact) || "minor";
    grouped.get(impact)?.push(v);
  }

  const band = scoreBand(scan.score);

  const userId = session?.user?.id;
  const ownedByMe = !!userId && scan.userId === userId;
  const claimable = !scan.userId;
  const savedScanOwnerPlan = scan.user?.plan ?? null;
  const savedScanRequiresAiUpgrade =
    !!scan.userId &&
    !(savedScanOwnerPlan ? entitlementsFor(savedScanOwnerPlan).aiFixes : false);

  const userPlan = session?.user?.plan ?? null;
  const effectiveOwnerPlan = ownedByMe ? savedScanOwnerPlan : userPlan;
  const viewerEntitlements = effectiveOwnerPlan ? entitlementsFor(effectiveOwnerPlan) : null;
  const canSeeAiFixes = !savedScanRequiresAiUpgrade;
  const canExportPdf = ownedByMe && viewerEntitlements?.pdfExport === true;
  const limitPlan = parsePlan(searchParams?.plan);
  const apiAiFlags = parseAiFlags(searchParams);
  const coverageTease = singlePageCoverageTease({
    host: hostOf(scan.url),
    loggedIn: !!userId,
    plan: effectiveOwnerPlan,
    claimable,
  });
  const riskCount = scan.violations.length;
  const visibleIssues = scan.violations.slice(0, 6);
  const visibleFixes = scan.violations
    .filter((violation) =>
      Boolean(violation.legalRationale || violation.plainEnglishFix || violation.codeExample),
    )
    .slice(0, 3);
  const fixesPanel = recommendedFixesState({
    scanId: scan.id,
    userId,
    userPlan: effectiveOwnerPlan,
    claimable,
    canSeeAiFixes,
    hasPersistedAi: visibleFixes.length > 0,
    apiAiFlags,
  });

  return (
    <PageShell loggedIn={!!userId}>
      {claimable && <ClaimBanner scanId={scan.id} loggedIn={!!userId} />}
      {ownedByMe && <SavedBanner />}
      {claimable && searchParams?.limit === "site_limit" && limitPlan && (
        <InlineBanner
          tone="upgrade"
          title="You hit your saved-site limit"
          body={`${savedSiteLimitMessage(limitPlan)} You can still keep this anonymous result public, or upgrade to save it.`}
          ctaHref="/pricing"
          ctaLabel="View plans"
        />
      )}
      {searchParams?.pdf === "pro_required" && ownedByMe && (
        <InlineBanner
          tone="upgrade"
          title="PDF export is locked on your plan"
          body={`PDF downloads are available on Pro. You're currently on ${planLabel(effectiveOwnerPlan ?? "FREE")}.`}
          ctaHref="/pricing"
          ctaLabel="Upgrade to Pro"
        />
      )}
      {searchParams?.pdf === "failed" && (
        <InlineBanner
          tone="error"
          title="We couldn't generate the PDF report"
          body="Try again in a moment. If this keeps happening, re-run the scan and export the newest report."
        />
      )}
      <InlineBanner
        tone="upgrade"
        title="This scan covered 1 page only"
        body={coverageTease.body}
        ctaHref={coverageTease.ctaHref}
        ctaLabel={coverageTease.ctaLabel}
      />

      <section className="container-page mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <div className="space-y-6">
          <div className="card p-8">
            <div className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-text-subtle">Scanned URL</p>
                <p className="mt-1 break-all font-mono text-sm text-text">{scan.url}</p>
                <p className="mt-3 text-xs text-text-subtle">
                  {new Date(scan.createdAt).toLocaleString()} · {riskCount} risk
                  {riskCount === 1 ? "" : "s"} found
                </p>
                {ownedByMe && (
                  <div className="mt-4">
                    {canExportPdf ? (
                      <a
                        href={`/api/scan/${scan.id}/pdf`}
                        className="btn-ghost text-sm"
                      >
                        Download PDF report
                      </a>
                    ) : (
                      <Link
                        href="/pricing"
                        className="text-xs text-text-subtle hover:text-text"
                      >
                        PDF report is a Pro feature →
                      </Link>
                    )}
                  </div>
                )}
              </div>
              <ScoreDial score={scan.score} band={band} />
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <ResultMetric
                label="Compliance score"
                value={`${scan.score}/100`}
                detail={band.label}
              />
              <ResultMetric
                label="Risks found"
                value={`${riskCount}`}
                detail={
                  riskCount === 0
                    ? "No risks detected on this page"
                    : `${riskCount} accessibility risk${riskCount === 1 ? "" : "s"} detected on this page`
                }
              />
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-text-subtle">Detected risks</p>
                <h2 className="mt-2 text-xl font-semibold text-text">
                  {riskCount === 0 ? "No risks detected" : `${riskCount} risk${riskCount === 1 ? "" : "s"} on this page`}
                </h2>
              </div>
              <span className="rounded-full border border-border px-3 py-1 text-xs text-text-subtle">
                1 page scanned
              </span>
            </div>

            {riskCount > 0 ? (
              <div className="mt-5 space-y-3">
                {visibleIssues.map((violation) => (
                  <RiskListItem key={violation.id} violation={violation} />
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-text-muted">
                axe-core didn&apos;t flag any automated risks on this page. Manual testing is still recommended.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {IMPACT_ORDER.map((impact) => (
              <SeverityPill
                key={impact}
                impact={impact}
                count={grouped.get(impact)?.length ?? 0}
              />
            ))}
          </div>
        </div>

        <RecommendedFixesPanel
          state={fixesPanel}
          fixes={visibleFixes}
          fallbackViolations={visibleIssues.slice(0, 3)}
        />
      </section>

      <section className="container-page mt-12 space-y-10 pb-24">
        {IMPACT_ORDER.map((impact) => {
          const items = grouped.get(impact) ?? [];
          if (items.length === 0) return null;
          return (
            <div key={impact}>
              <div className="mb-4 flex items-baseline justify-between">
                <h2 className="text-xl font-semibold">
                  <span
                    className="mr-2 inline-block h-2 w-2 rounded-full align-middle"
                    style={{ background: `var(--tw-${impact})`, backgroundColor: severityColor(impact) }}
                  />
                  {IMPACT_LABELS[impact]}
                  <span className="ml-2 text-sm font-normal text-text-muted">
                    ({items.length})
                  </span>
                </h2>
                <p className="hidden text-xs text-text-subtle sm:block">{IMPACT_COPY[impact]}</p>
              </div>
              <div className="space-y-4">
                {items.map((v) => (
                  <ViolationCard key={v.id} violation={v} />
                ))}
              </div>
            </div>
          );
        })}

        {scan.violations.length === 0 && (
          <div className="card p-10 text-center">
            <h2 className="text-2xl font-semibold">No WCAG violations found</h2>
            <p className="mt-2 text-sm text-text-muted">
              axe-core didn&apos;t flag any automated failures. Manual testing with screen readers is still recommended for
              full confidence.
            </p>
          </div>
        )}
      </section>
    </PageShell>
  );
}

function PageShell({ children, loggedIn }: { children: React.ReactNode; loggedIn?: boolean }) {
  return (
    <main className="min-h-screen">
      <header className="container-page flex items-center justify-between py-6">
        <Link href="/">
          <Logo />
        </Link>
        <div className="flex items-center gap-3">
          {loggedIn ? (
            <Link href="/dashboard" className="btn-ghost">
              Dashboard
            </Link>
          ) : (
            <Link href="/login" className="text-sm text-text-muted hover:text-text">
              Sign in
            </Link>
          )}
          <Link href="/" className="btn-ghost">
            New scan
          </Link>
        </div>
      </header>
      {children}
    </main>
  );
}

function ClaimBanner({ scanId, loggedIn }: { scanId: string; loggedIn: boolean }) {
  const href = loggedIn ? `/claim/${scanId}` : `/signup?scanId=${scanId}`;
  const cta = loggedIn ? "Save to dashboard" : "Sign up to save";
  return (
    <section className="container-page mt-10">
      <div className="card flex flex-col items-start justify-between gap-4 border-accent-muted bg-accent-muted/10 p-5 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-medium text-text">
            {loggedIn ? "Save this scan to track progress over time." : "Create a free account to save this scan."}
          </p>
          <p className="mt-1 text-xs text-text-muted">
            Re-scan on demand, compare scores, and get alerts when things regress.
          </p>
        </div>
        <Link href={href} className="btn-primary whitespace-nowrap">
          {cta}
        </Link>
      </div>
    </section>
  );
}

function SavedBanner() {
  return (
    <section className="container-page mt-10">
      <div className="card flex items-center justify-between gap-4 border-accent-muted bg-accent-muted/10 p-4">
        <p className="text-sm text-text">
          <span className="mr-2 inline-block h-2 w-2 rounded-full bg-accent align-middle" />
          Saved to your dashboard
        </p>
        <Link href="/dashboard" className="text-sm text-accent hover:underline">
          View history →
        </Link>
      </div>
    </section>
  );
}

function InlineBanner({
  title,
  body,
  tone,
  ctaHref,
  ctaLabel,
}: {
  title: string;
  body: string;
  tone: "upgrade" | "error";
  ctaHref?: string;
  ctaLabel?: string;
}) {
  const toneClass =
    tone === "error"
      ? "border-severity-critical/40 bg-severity-critical/10"
      : "border-accent-muted bg-accent-muted/10";

  return (
    <section className="container-page mt-6">
      <div className={`card flex flex-col items-start justify-between gap-4 p-5 sm:flex-row sm:items-center ${toneClass}`}>
        <div>
          <p className="text-sm font-semibold text-text">{title}</p>
          <p className="mt-1 text-sm text-text-muted">{body}</p>
        </div>
        {ctaHref && ctaLabel ? (
          <Link href={ctaHref} className="btn-primary whitespace-nowrap">
            {ctaLabel}
          </Link>
        ) : null}
      </div>
    </section>
  );
}

function ScoreDial({
  score,
  band,
}: {
  score: number;
  band: { label: string; tone: "good" | "warn" | "bad" };
}) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - score / 100);
  const color = band.tone === "good" ? "#22c55e" : band.tone === "warn" ? "#f59e0b" : "#ef4444";

  return (
    <div className="flex items-center gap-5">
      <div className="relative h-32 w-32">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 128 128" aria-hidden="true">
          <circle cx="64" cy="64" r={radius} stroke="#262626" strokeWidth="8" fill="none" />
          <circle
            cx="64"
            cy="64"
            r={radius}
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-semibold tabular-nums">{score}</span>
          <span className="text-[10px] uppercase tracking-wider text-text-subtle">out of 100</span>
        </div>
      </div>
      <div>
        <p className="text-xs uppercase tracking-wider text-text-subtle">Compliance</p>
        <p className="text-lg font-semibold" style={{ color }}>
          {band.label}
        </p>
      </div>
    </div>
  );
}

function SeverityPill({ impact, count }: { impact: Impact; count: number }) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-text-subtle">
          {IMPACT_LABELS[impact]}
        </span>
        <span
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: severityColor(impact) }}
        />
      </div>
      <p className="mt-2 text-2xl font-semibold tabular-nums">{count}</p>
    </div>
  );
}

function ResultMetric({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-bg-muted/50 p-4">
      <p className="text-xs uppercase tracking-wider text-text-subtle">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-text">{value}</p>
      <p className="mt-1 text-xs text-text-muted">{detail}</p>
    </div>
  );
}

function RiskListItem({
  violation,
}: {
  violation: {
    id: string;
    help: string;
    impact: string;
    description: string;
  };
}) {
  return (
    <div className="rounded-xl border border-border bg-bg-muted/40 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-text">{violation.help}</p>
          <p className="mt-1 text-sm text-text-muted">{violation.description}</p>
        </div>
        <span className="rounded-full border border-border px-2.5 py-1 text-[11px] uppercase tracking-wider text-text-subtle">
          {violation.impact || "minor"}
        </span>
      </div>
    </div>
  );
}

function ViolationCard({
  violation,
}: {
  violation: {
    id: string;
    axeId: string;
    impact: string;
    help: string;
    description: string;
    helpUrl: string;
    element: string;
    selector: string;
    legalRationale: string | null;
    plainEnglishFix: string | null;
    codeExample: string | null;
  };
}) {
  return (
    <article className="card p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold">{violation.help}</h3>
          <p className="mt-1 font-mono text-xs text-text-subtle">{violation.axeId}</p>
        </div>
        <a
          href={violation.helpUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-accent hover:underline"
        >
          axe-core docs ↗
        </a>
      </div>

      <p className="mt-4 text-sm text-text-muted">{violation.description}</p>

      <Section label="Affected element">
        <code className="block overflow-x-auto rounded-md border border-border bg-bg-muted p-3 font-mono text-xs text-text">
          {violation.selector || "(no selector)"}
        </code>
        {violation.element && (
          <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-all rounded-md border border-border bg-bg-muted p-3 font-mono text-xs text-text-muted">
            {violation.element}
          </pre>
        )}
      </Section>
    </article>
  );
}

function RecommendedFixesPanel({
  state,
  fixes,
  fallbackViolations,
}: {
  state: ReturnType<typeof recommendedFixesState>;
  fixes: {
    id: string;
    help: string;
    legalRationale: string | null;
    plainEnglishFix: string | null;
    codeExample: string | null;
  }[];
  fallbackViolations: {
    id: string;
    help: string;
    impact: string;
  }[];
}) {
  return (
    <aside className="card h-fit p-6 lg:sticky lg:top-6">
      <p className="text-xs uppercase tracking-wider text-text-subtle">Recommended Fixes</p>
      <h2 className="mt-2 text-2xl font-semibold text-text">What to fix next</h2>
      <div className="mt-4 space-y-2 text-sm text-text-muted">
        <p>New accessibility risks can appear anytime.</p>
        <p>You scanned 1 page — more pages may have issues.</p>
      </div>

      {state.mode === "visible" ? (
        <div className="mt-6 space-y-4">
          {fixes.length > 0 ? (
            fixes.map((fix) => <VisibleFixCard key={fix.id} fix={fix} />)
          ) : (
            <p className="rounded-xl border border-border bg-bg-muted/40 p-4 text-sm text-text-muted">
              AI fixes were not generated for this scan.
            </p>
          )}
        </div>
      ) : (
        <LockedAiPreview state={state} fallbackViolations={fallbackViolations} />
      )}
    </aside>
  );
}

function VisibleFixCard({
  fix,
}: {
  fix: {
    id: string;
    help: string;
    legalRationale: string | null;
    plainEnglishFix: string | null;
    codeExample: string | null;
  };
}) {
  return (
    <div className="rounded-xl border border-border bg-bg-muted/40 p-4">
      <p className="text-sm font-semibold text-text">{fix.help}</p>
      {fix.plainEnglishFix && (
        <p className="mt-2 text-sm text-text">{fix.plainEnglishFix}</p>
      )}
      {fix.legalRationale && (
        <p className="mt-2 text-xs text-text-muted">{fix.legalRationale}</p>
      )}
    </div>
  );
}

function LockedAiPreview({
  state,
  fallbackViolations,
}: {
  state: ReturnType<typeof recommendedFixesState>;
  fallbackViolations: { id: string; help: string; impact: string }[];
}) {
  return (
    <div className="relative mt-5 overflow-hidden rounded-xl border border-accent-muted/40 bg-bg-muted/70">
      <div className="space-y-4 p-4 blur-sm">
        {fallbackViolations.map((violation) => (
          <div key={violation.id} className="rounded-xl border border-border bg-bg p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-semibold text-text">{violation.help}</p>
              <span className="rounded-full border border-border px-2 py-1 text-[10px] uppercase tracking-wider text-text-subtle">
                {violation.impact || "minor"}
              </span>
            </div>
            <div className="mt-3 space-y-2">
              <LockedLine className="w-full" />
              <LockedLine className="w-11/12" />
              <LockedLine className="w-4/5" />
            </div>
          </div>
        ))}
      </div>
      <div className="absolute inset-0 flex flex-col items-start justify-center bg-bg/55 p-5">
        <p className="text-sm font-semibold text-text">
          <LockIcon /> AI fix suggestions are locked
        </p>
        <p className="mt-1 max-w-md text-sm text-text-muted">
          {state.body}
        </p>
        {state.ctaHref && state.ctaLabel ? (
          <Link href={state.ctaHref} className="btn-primary mt-4 text-sm">
            {state.ctaLabel}
          </Link>
        ) : null}
      </div>
    </div>
  );
}

function LockedLine({ className }: { className: string }) {
  return <div className={`h-3 rounded-full bg-white/10 ${className}`} />;
}

function LockedBlock() {
  return (
    <div className="space-y-2">
      <LockedLine className="w-full" />
      <LockedLine className="w-11/12" />
      <LockedLine className="w-4/5" />
    </div>
  );
}

function LockIcon() {
  return (
    <svg
      className="mr-1 inline h-3.5 w-3.5 -translate-y-px text-accent"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
    >
      <rect x="4" y="9" width="12" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M7 9V6a3 3 0 1 1 6 0v3" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-5">
      <p className="mb-2 text-xs uppercase tracking-wider text-text-subtle">{label}</p>
      {children}
    </div>
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

function parsePlan(value: string | undefined): "FREE" | "STARTER" | "PRO" | null {
  return value === "FREE" || value === "STARTER" || value === "PRO" ? value : null;
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "this site";
  }
}

function singlePageCoverageTease({
  host,
  loggedIn,
  plan,
  claimable,
}: {
  host: string;
  loggedIn: boolean;
  plan: "FREE" | "STARTER" | "PRO" | null;
  claimable: boolean;
}) {
  const scope = `We only scanned the page you entered. Other pages on ${host} may still contain accessibility issues, broken flows, or regressions this report didn't catch.`;

  if (plan === "PRO") {
    return {
      body: `${scope} Save tracked sites in your dashboard to keep monitoring them over time.`,
      ctaHref: claimable ? "/dashboard" : "/dashboard",
      ctaLabel: "Open dashboard",
    };
  }

  if (plan === "STARTER") {
    return {
      body: `${scope} Upgrade to Pro for broader multi-site monitoring and weekly automated coverage.`,
      ctaHref: "/pricing",
      ctaLabel: "Upgrade to Pro",
    };
  }

  if (loggedIn) {
    return {
      body: `${scope} Upgrade to Starter or Pro to turn one-off checks into ongoing site monitoring.`,
      ctaHref: "/pricing",
      ctaLabel: "View plans",
    };
  }

  return {
    body: `${scope} Create an account and upgrade when you're ready for broader coverage and ongoing monitoring.`,
    ctaHref: "/pricing",
    ctaLabel: "View plans",
  };
}

function parseAiFlags(
  searchParams:
    | {
        aiEnabled?: string;
        requiresLoginForAI?: string;
        requiresUpgradeForAI?: string;
        aiLimitReached?: string;
      }
    | undefined,
) {
  return {
    aiEnabled: searchParams?.aiEnabled === "1",
    requiresLoginForAI: searchParams?.requiresLoginForAI === "1",
    requiresUpgradeForAI: searchParams?.requiresUpgradeForAI === "1",
    aiLimitReached: searchParams?.aiLimitReached === "1",
  };
}

function recommendedFixesState({
  scanId,
  userId,
  userPlan,
  claimable,
  canSeeAiFixes,
  hasPersistedAi,
  apiAiFlags,
}: {
  scanId: string;
  userId: string | undefined;
  userPlan: "FREE" | "STARTER" | "PRO" | null;
  claimable: boolean;
  canSeeAiFixes: boolean;
  hasPersistedAi: boolean;
  apiAiFlags: ReturnType<typeof parseAiFlags>;
}) {
  if (hasPersistedAi && canSeeAiFixes) {
    return { mode: "visible" as const };
  }

  if (apiAiFlags.requiresLoginForAI || (!userId && claimable)) {
    return {
      mode: "locked" as const,
      body: "Log in to see recommended fixes, save your scan, and keep tracking new accessibility regressions over time.",
      ctaHref: `/login?scanId=${encodeURIComponent(scanId)}`,
      ctaLabel: "Log in to see recommended fixes",
    };
  }

  if (apiAiFlags.requiresUpgradeForAI || userPlan === "FREE") {
    return {
      mode: "locked" as const,
      body: "Upgrade to generate recommended fixes with legal rationale, plain-English steps, and copy-ready remediation guidance.",
      ctaHref: "/pricing",
      ctaLabel: "Upgrade to generate fixes",
    };
  }

  if (apiAiFlags.aiLimitReached) {
    return {
      mode: "locked" as const,
      body:
        userPlan === "STARTER"
          ? "You reached your monthly AI fix limit on Starter. Upgrade to Pro for higher coverage."
          : "You reached your monthly AI fix limit for now. New AI fixes will become available again next month.",
      ctaHref: userPlan === "STARTER" ? "/pricing" : undefined,
      ctaLabel: userPlan === "STARTER" ? "Upgrade to Pro" : undefined,
    };
  }

  return {
    mode: "locked" as const,
    body: "Recommended fixes are not available for this scan yet. Save it and re-scan from your dashboard to keep monitoring changes over time.",
    ctaHref: claimable ? `/login?scanId=${encodeURIComponent(scanId)}` : "/dashboard",
    ctaLabel: claimable ? "Save this scan" : "Open dashboard",
  };
}
