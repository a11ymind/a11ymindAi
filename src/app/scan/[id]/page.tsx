import Link from "next/link";
import { notFound } from "next/navigation";
import { CopyFixButton } from "@/components/CopyFixButton";
import { CopyButton } from "@/components/CopyButton";
import { Logo } from "@/components/Logo";
import { RescanButton } from "@/components/RescanButton";
import { ShareReportButton } from "@/components/ShareReportButton";
import { prisma } from "@/lib/prisma";
import { scoreBand } from "@/lib/score";
import { getSession } from "@/lib/auth";
import {
  entitlementsFor,
  planLabel,
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
    aiUsageCurrent?: string;
    aiUsageLimit?: string;
    aiUsageRemaining?: string;
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

  const previousScan = await findPreviousComparableScan(scan);
  const previousAxeIds = new Set(
    (previousScan?.violations ?? []).map((v) => v.axeId),
  );
  const baseUrl = normalizeBaseUrl(
    process.env.NEXT_PUBLIC_APP_URL ??
      process.env.NEXTAUTH_URL ??
      "http://localhost:3000",
  );

  if (scan.status === "FAILED") {
    return (
      <PageShell>
        <div className="card mx-auto mt-20 max-w-xl p-8 text-center">
          <h1 className="text-xl font-semibold">We couldn&apos;t scan that URL.</h1>
          <p className="mt-2 text-sm text-text-muted">{scan.error || "Unknown error."}</p>
          <Link href="/" className="btn-primary mt-6">
            Scan another page
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
  const savedToDashboard = ownedByMe && !!scan.siteId;
  const claimable = !scan.siteId && (!scan.userId || ownedByMe);
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
  const comparison = buildScanComparison(scan, previousScan);
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
      {savedToDashboard && <SavedBanner />}
      {claimable && searchParams?.limit === "site_limit" && limitPlan && (
        <InlineBanner
          tone="upgrade"
          title="You hit your saved-site limit"
          body={`You can monitor ${limitPlan === "PRO" ? "10 websites" : "1 website"} on your current plan. You can still scan any page manually, or upgrade to track more sites.`}
          ctaHref="/pricing"
          ctaLabel="Start monitoring"
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
          <div className="overflow-hidden rounded-[1.5rem] border border-border bg-[linear-gradient(180deg,rgba(14,17,22,0.92),rgba(14,17,22,0.72))] shadow-glow">
            <div className="border-b border-border/70 px-6 py-4 sm:px-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.22em] text-text-subtle">
                    Accessibility report
                  </p>
                  <p className="mt-1 text-sm text-text-muted">
                    Generated {new Date(scan.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-text-subtle">
                  <span className="rounded-full border border-border px-2.5 py-1">1 page scanned</span>
                  <span className="rounded-full border border-border px-2.5 py-1">
                    {previousScan ? "Comparison available" : "Baseline scan"}
                  </span>
                  {ownedByMe && (
                    <span className="rounded-full border border-border px-2.5 py-1">
                      {canExportPdf ? "PDF ready" : "PDF on Pro"}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid gap-8 px-6 py-7 sm:px-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
              <div>
                <p className="text-xs uppercase tracking-wider text-text-subtle">Scanned URL</p>
                <p className="mt-2 break-all font-mono text-sm text-text">{scan.url}</p>
                <h1 className="mt-5 max-w-3xl text-balance text-3xl font-semibold tracking-tight text-text sm:text-4xl">
                  {riskCount === 0
                    ? "This page looks clean in automated testing."
                    : `${riskCount} accessibility risk${riskCount === 1 ? "" : "s"} need attention on this page.`}
                </h1>
                <p className="mt-4 max-w-2xl text-sm leading-relaxed text-text-muted sm:text-base">
                  This report is designed to help your team understand what changed, what
                  matters most, and what to fix next without translating raw WCAG output by
                  hand.
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <RescanButton url={scan.url} label="Re-scan site" />
                  {ownedByMe && scan.status === "COMPLETED" && (
                    <ShareReportButton
                      scanId={scan.id}
                      baseUrl={baseUrl}
                      initialToken={scan.shareToken ?? null}
                    />
                  )}
                  {ownedByMe && (
                    <>
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
                    </>
                  )}
                </div>
              </div>
              <ScoreDial score={scan.score} band={band} />
            </div>

            <div className="grid gap-px border-t border-border/70 bg-border/60 sm:grid-cols-2 xl:grid-cols-4">
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
              <ResultMetric
                label="Score change"
                value={comparison.deltaLabel}
                detail={comparison.deltaDetail}
              />
              <ResultMetric
                label="Progress since last scan"
                value={comparison.progressLabel}
                detail={comparison.issueDetail}
              />
            </div>
            <p className="px-6 py-5 text-sm text-text-muted sm:px-8">
              Some of these accessibility risks may impact usability, conversions, and accessibility compliance.
            </p>
          </div>

          <div className="overflow-hidden rounded-[1.5rem] border border-border bg-bg-elevated/50">
            <div className="flex items-start justify-between gap-4">
              <div className="px-6 py-6 sm:px-7">
                <p className="text-xs uppercase tracking-wider text-text-subtle">Detected risks</p>
                <h2 className="mt-2 text-xl font-semibold text-text">
                  {riskCount === 0
                    ? "No accessibility risks detected"
                    : `${riskCount} accessibility risk${riskCount === 1 ? "" : "s"} on this page`}
                </h2>
                <p className="mt-2 text-sm text-text-muted">
                  Some of these may affect how people navigate, read, or complete key actions on the page.
                </p>
              </div>
              <span className="mr-6 mt-6 rounded-full border border-border px-3 py-1 text-xs text-text-subtle">
                1 page scanned
              </span>
            </div>

            {riskCount > 0 ? (
              <div className="border-t border-border/70 px-6 py-5 sm:px-7">
                <div className="mb-4 flex flex-wrap items-center gap-2 text-[11px] text-text-subtle">
                  <span className="rounded-full border border-accent/20 bg-accent/10 px-2.5 py-1 text-accent">
                    New risks: {comparison.newCount}
                  </span>
                  <span className="rounded-full border border-border px-2.5 py-1">
                    Fixed risks: {comparison.fixedCount}
                  </span>
                  <span className="rounded-full border border-border px-2.5 py-1">
                    Score change: {comparison.deltaLabel}
                  </span>
                </div>
                <div className="space-y-3">
                {visibleIssues.map((violation) => (
                  <RiskListItem
                    key={violation.id}
                    violation={violation}
                    isNew={
                      previousScan
                        ? !previousAxeIds.has(violation.axeId)
                        : false
                    }
                    hasBaseline={!!previousScan}
                  />
                ))}
                </div>
              </div>
            ) : (
              <p className="border-t border-border/70 px-6 py-5 text-sm text-text-muted sm:px-7">
                axe-core didn&apos;t flag any automated risks on this page. Manual testing is still recommended.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border/60 md:grid-cols-4">
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

      {riskCount > 0 && (
        <section className="container-page mt-10">
          <div className="sticky top-0 z-10 -mx-1 flex flex-wrap gap-2 bg-bg/85 px-1 py-3 backdrop-blur">
            {IMPACT_ORDER.map((impact) => {
              const count = grouped.get(impact)?.length ?? 0;
              if (count === 0) return null;
              return (
                <a
                  key={impact}
                  href={`#impact-${impact}`}
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

      <section className="container-page mt-6 space-y-10 pb-24">
        {IMPACT_ORDER.map((impact) => {
          const items = grouped.get(impact) ?? [];
          if (items.length === 0) return null;
          return (
            <div key={impact} id={`impact-${impact}`}>
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
                  <ViolationCard
                    key={v.id}
                    violation={v}
                    isNew={previousScan ? !previousAxeIds.has(v.axeId) : false}
                    hasBaseline={!!previousScan}
                  />
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
              Log in
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
  const cta = loggedIn ? "Save to dashboard" : "Create account to save";
  return (
    <section className="container-page mt-10">
      <div className="card flex flex-col items-start justify-between gap-4 border-accent-muted bg-accent-muted/10 p-5 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-medium text-text">
            {loggedIn
              ? "Save this scan and turn this website into an ongoing monitoring workflow."
              : "Create a free account to save this scan and keep working from it later."}
          </p>
          <p className="mt-1 text-xs text-text-muted">
            Re-scan on demand, track improvements over time, and keep your history in one place as the site changes.
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
          Saved to your dashboard for ongoing monitoring
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
    <div className="flex items-center gap-5 rounded-2xl border border-border/70 bg-bg-muted/20 px-4 py-4">
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
    <div className="bg-bg-elevated/60 p-4">
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
    <div className="bg-bg-elevated/60 p-4">
      <p className="text-xs uppercase tracking-wider text-text-subtle">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-text">{value}</p>
      <p className="mt-1 text-xs text-text-muted">{detail}</p>
    </div>
  );
}

function RiskListItem({
  violation,
  isNew,
  hasBaseline,
}: {
  violation: {
    id: string;
    help: string;
    impact: string;
    description: string;
  };
  isNew: boolean;
  hasBaseline: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-bg-muted/30 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-text">{violation.help}</p>
            <DiffBadge isNew={isNew} hasBaseline={hasBaseline} />
          </div>
          <p className="mt-1 text-sm text-text-muted">{violation.description}</p>
          <p className="mt-2 text-xs text-text-subtle">
            <span className="font-medium text-text">What this means:</span> {plainEnglishRiskMeaning(violation.help, violation.description)}
          </p>
          <p className="mt-1 text-xs text-text-subtle">
            <span className="font-medium text-text">Why it matters:</span> {plainEnglishRiskImpact(violation.help, violation.impact)}
          </p>
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
  isNew,
  hasBaseline,
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
  isNew: boolean;
  hasBaseline: boolean;
}) {
  return (
    <article className="rounded-[1.25rem] border border-border bg-bg-elevated/45 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold">{violation.help}</h3>
            <DiffBadge isNew={isNew} hasBaseline={hasBaseline} />
          </div>
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
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-border bg-bg-muted/40 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-text-subtle">
            What this means
          </p>
          <p className="mt-2 text-sm text-text">
            {plainEnglishRiskMeaning(violation.help, violation.description)}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-bg-muted/40 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-text-subtle">
            Why it matters
          </p>
          <p className="mt-2 text-sm text-text">
            {plainEnglishRiskImpact(violation.help, violation.impact)}
          </p>
        </div>
      </div>

      <Section label="Affected element">
        <div className="flex items-center justify-between gap-2">
          <code className="block flex-1 overflow-x-auto rounded-md border border-border bg-bg-muted p-3 font-mono text-xs text-text">
            {violation.selector || "(no selector)"}
          </code>
          {violation.selector && (
            <CopyButton text={violation.selector} label="Copy selector" />
          )}
        </div>
        {violation.element && (
          <div className="mt-2 flex items-start justify-between gap-2">
            <pre className="flex-1 overflow-x-auto whitespace-pre-wrap break-all rounded-md border border-border bg-bg-muted p-3 font-mono text-xs text-text-muted">
              {violation.element}
            </pre>
            <CopyButton text={violation.element} label="Copy HTML" />
          </div>
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
    description: string;
    selector: string;
    element: string;
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
  const usage =
    "aiUsageLimit" in state && state.aiUsageLimit !== null && state.aiUsageCurrent !== null
      ? {
          current: state.aiUsageCurrent,
          limit: state.aiUsageLimit,
          remaining: state.aiUsageRemaining,
          limitReached: state.aiLimitReached,
        }
      : null;

  return (
    <aside className="overflow-hidden rounded-[1.5rem] border border-border bg-[linear-gradient(180deg,rgba(16,20,26,0.95),rgba(14,17,22,0.82))] lg:sticky lg:top-6">
      <div className="border-b border-border/70 px-6 py-5">
        <p className="text-xs uppercase tracking-wider text-text-subtle">Recommended Fixes</p>
        <h2 className="mt-2 text-2xl font-semibold text-text">What to fix next</h2>
        <div className="mt-4 space-y-2 text-sm text-text-muted">
        <p>New accessibility risks can appear anytime.</p>
        <p>You scanned 1 page — more pages may have accessibility risks.</p>
        </div>
      </div>
      {usage && <AiUsagePanel usage={usage} />}

      {state.mode === "visible" ? (
        <div className="space-y-4 px-6 py-6">
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
    description: string;
    selector: string;
    element: string;
    legalRationale: string | null;
    plainEnglishFix: string | null;
    codeExample: string | null;
  };
}) {
  const beforeSnippet = fix.element || fix.selector || fix.description;
  const afterSnippet = fix.codeExample || fix.plainEnglishFix || fix.legalRationale || "";
  const copyText = fix.codeExample || fix.plainEnglishFix || afterSnippet;
  const timeToFix = estimateFixTime(fix.help, fix.codeExample, fix.plainEnglishFix);

  return (
    <div className="rounded-[1.15rem] border border-border bg-bg-muted/30 p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold text-text">{fix.help}</p>
        {copyText ? <CopyFixButton text={copyText} /> : null}
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-text-subtle">
        <span className="rounded-full border border-border px-2.5 py-1">
          Takes ~{timeToFix}
        </span>
        <span className="rounded-full border border-border px-2.5 py-1">
          Based on accessibility guidelines
        </span>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <FixBlock label="Before" value={beforeSnippet || "Current markup or behavior needs improvement."} />
        <FixBlock label="After" value={afterSnippet || "Apply the recommended accessibility fix to improve this experience."} />
      </div>
      {fix.plainEnglishFix && (
        <p className="mt-3 text-sm text-text">{fix.plainEnglishFix}</p>
      )}
      {fix.legalRationale && (
        <p className="mt-2 text-xs text-text-muted">{fix.legalRationale}</p>
      )}
    </div>
  );
}

function FixBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-bg/50 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-text-subtle">{label}</p>
      <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-all font-mono text-xs text-text">
        {value}
      </pre>
    </div>
  );
}

function AiUsagePanel({
  usage,
}: {
  usage: {
    current: number;
    limit: number;
    remaining: number | null;
    limitReached: boolean;
  };
}) {
  const percent = Math.max(0, Math.min(100, Math.round((usage.current / usage.limit) * 100)));
  const toneClass = usage.limitReached
    ? "border-severity-critical/40 bg-severity-critical/10"
    : percent >= 80
      ? "border-[#f59e0b]/40 bg-[#f59e0b]/10"
      : percent >= 50
        ? "border-border bg-bg-muted/50"
        : "border-border bg-bg-muted/30";
  const barClass = usage.limitReached
    ? "bg-severity-critical"
    : percent >= 80
      ? "bg-[#f59e0b]"
      : "bg-accent";
  const message = usage.limitReached
    ? "AI fix limit reached for this billing month."
    : percent >= 80
      ? `Only ${usage.remaining ?? 0} AI fix generation${usage.remaining === 1 ? "" : "s"} left this month.`
      : percent >= 50
        ? "You are halfway through this month's AI fix allowance."
        : "AI fixes are available for this scan.";

  return (
    <div className={`mt-5 rounded-xl border p-4 ${toneClass}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-text">AI fixes used: {usage.current} / {usage.limit}</p>
        <p className="text-xs text-text-subtle">{percent}% used</p>
      </div>
      <div className="mt-3 h-2 rounded-full bg-white/10">
        <div className={`h-2 rounded-full transition-all ${barClass}`} style={{ width: `${percent}%` }} />
      </div>
      <p className="mt-3 text-xs text-text-muted">{message}</p>
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
    <div className="relative border-t border-border/70 px-6 py-6">
      <div className="space-y-4">
        {fallbackViolations.map((violation) => (
          <div key={violation.id} className="rounded-[1.15rem] border border-border bg-bg p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-semibold text-text">{violation.help}</p>
              <span className="rounded-full border border-border px-2 py-1 text-[10px] uppercase tracking-wider text-text-subtle">
                {violation.impact || "minor"}
              </span>
            </div>
            <p className="mt-3 text-sm text-text">
              {lockedFixPreview(violation.help)}
            </p>
            <div className="mt-3 space-y-2 blur-sm">
              <LockedLine className="w-full" />
              <LockedLine className="w-11/12" />
              <LockedLine className="w-4/5" />
            </div>
          </div>
        ))}
      </div>
      <div className="absolute inset-0 flex flex-col items-start justify-center bg-[linear-gradient(180deg,rgba(11,13,17,0.2),rgba(11,13,17,0.88)_30%,rgba(11,13,17,0.94))] p-6">
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

function DiffBadge({
  isNew,
  hasBaseline,
}: {
  isNew: boolean;
  hasBaseline: boolean;
}) {
  if (!hasBaseline) return null;
  if (isNew) {
    return (
      <span className="rounded-full border border-severity-critical/60 bg-severity-critical/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-severity-critical">
        New
      </span>
    );
  }
  return (
    <span className="rounded-full border border-border bg-bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wider text-text-subtle">
      Recurring
    </span>
  );
}

function normalizeBaseUrl(url: string) {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

function severityColor(impact: Impact): string {
  return {
    critical: "#ef4444",
    serious: "#f97316",
    moderate: "#eab308",
    minor: "#3b82f6",
  }[impact];
}

function plainEnglishRiskMeaning(help: string, description: string): string {
  const text = `${help} ${description}`.toLowerCase();

  if (text.includes("contrast")) {
    return "Important text or interface elements may blend into the background and become hard to read.";
  }
  if (text.includes("label")) {
    return "A form control or interactive element may not have a clear name that assistive technology can announce.";
  }
  if (text.includes("heading")) {
    return "The page structure may be harder to scan because sections are not clearly organized for people using assistive tools.";
  }
  if (text.includes("link")) {
    return "A link may not clearly describe where it goes or what action it triggers.";
  }
  if (text.includes("button")) {
    return "An action may be present visually but not described clearly enough for assistive technology users.";
  }
  if (text.includes("image") || text.includes("alt")) {
    return "A visual element may be missing text that explains its purpose to people who cannot see it.";
  }

  return "People using keyboards, screen readers, or magnification may not get the same information or feedback as sighted mouse users.";
}

function plainEnglishRiskImpact(help: string, impact: string): string {
  const level = impact.toLowerCase();
  const base =
    level === "critical"
      ? "This can block someone from completing a key task."
      : level === "serious"
        ? "This can create major friction for people relying on assistive technology."
        : level === "moderate"
          ? "This can make the page confusing or unreliable for some users."
          : "This can still add unnecessary friction and reduce confidence in the experience.";

  const text = help.toLowerCase();
  if (text.includes("form") || text.includes("label")) {
    return `${base} It often affects signups, checkouts, contact forms, or other conversion steps.`;
  }
  if (text.includes("link") || text.includes("button")) {
    return `${base} It can make navigation and next steps harder to understand.`;
  }
  if (text.includes("contrast")) {
    return `${base} It usually hurts readability and makes content easier to miss.`;
  }

  return base;
}

function lockedFixPreview(help: string): string {
  const text = help.toLowerCase();

  if (text.includes("contrast")) {
    return "Increase contrast so important text and controls stay readable in real-world lighting.";
  }
  if (text.includes("label")) {
    return "Add a clear accessible name so screen readers can explain what this control does.";
  }
  if (text.includes("heading")) {
    return "Use a clearer heading structure so the page reads in a logical order.";
  }
  if (text.includes("link")) {
    return "Rewrite the link text so users understand the destination before they click.";
  }
  if (text.includes("image") || text.includes("alt")) {
    return "Add descriptive alternative text so the image's purpose is still communicated.";
  }

  return "Apply a targeted accessibility fix with plain-English steps and implementation guidance.";
}

function estimateFixTime(
  help: string,
  codeExample: string | null,
  plainEnglishFix: string | null,
) {
  const text = `${help} ${codeExample ?? ""} ${plainEnglishFix ?? ""}`.toLowerCase();

  if (text.includes("contrast") || text.includes("alt") || text.includes("label")) {
    return "1 minute";
  }
  if (text.includes("heading") || text.includes("button") || text.includes("link")) {
    return "3 minutes";
  }
  if (text.includes("form") || text.includes("keyboard") || text.includes("focus")) {
    return "5 minutes";
  }
  return "2 minutes";
}

function parsePlan(value: string | undefined): "FREE" | "STARTER" | "PRO" | null {
  return value === "FREE" || value === "STARTER" || value === "PRO" ? value : null;
}

async function findPreviousComparableScan(scan: {
  id: string;
  createdAt: Date;
  siteId: string | null;
  userId: string | null;
  url: string;
}) {
  const select = {
    id: true,
    score: true,
    createdAt: true,
    violations: { select: { axeId: true } },
  } as const;

  if (scan.siteId) {
    return prisma.scan.findFirst({
      where: {
        siteId: scan.siteId,
        status: "COMPLETED",
        createdAt: { lt: scan.createdAt },
        id: { not: scan.id },
      },
      orderBy: { createdAt: "desc" },
      select,
    });
  }

  if (scan.userId) {
    return prisma.scan.findFirst({
      where: {
        userId: scan.userId,
        url: scan.url,
        status: "COMPLETED",
        createdAt: { lt: scan.createdAt },
        id: { not: scan.id },
      },
      orderBy: { createdAt: "desc" },
      select,
    });
  }

  return null;
}

function buildScanComparison(
  current: {
    score: number;
    violations: { axeId: string }[];
  },
  previous:
    | {
        score: number;
        createdAt: Date;
        violations: { axeId: string }[];
      }
    | null,
) {
  if (!previous) {
    return {
      deltaLabel: "No baseline",
      deltaDetail: "Run another scan to measure progress over time.",
      progressLabel: "No baseline",
      newCount: 0,
      fixedCount: 0,
      issueDetail: "No earlier scan available for comparison.",
    };
  }

  const delta = current.score - previous.score;
  const currentIssues = new Set(current.violations.map((violation) => violation.axeId));
  const previousIssues = new Set(previous.violations.map((violation) => violation.axeId));
  let newCount = 0;
  let fixedCount = 0;

  for (const axeId of currentIssues) {
    if (!previousIssues.has(axeId)) newCount += 1;
  }

  for (const axeId of previousIssues) {
    if (!currentIssues.has(axeId)) fixedCount += 1;
  }

  return {
    deltaLabel: delta === 0 ? "No change" : `${delta > 0 ? "+" : ""}${delta} points`,
    deltaDetail: `${Math.abs(delta)} point${Math.abs(delta) === 1 ? "" : "s"} ${delta >= 0 ? "better" : "lower"} than the previous scan`,
    progressLabel: `${fixedCount} fixed / ${newCount} new`,
    newCount,
    fixedCount,
    issueDetail: `New risks: ${newCount} · Fixed risks: ${fixedCount}`,
  };
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
  const scope = `We only scanned the page you entered. Other pages on ${host} may still contain accessibility risks, broken flows, or regressions this report didn't catch.`;

  if (plan === "PRO") {
    return {
      body: `${scope} Accessibility issues can appear again as your site changes, so keep monitored sites in your dashboard and stay ahead of regressions.`,
      ctaHref: claimable ? "/dashboard" : "/dashboard",
      ctaLabel: "Start monitoring",
    };
  }

  if (plan === "STARTER") {
    return {
      body: `${scope} Accessibility issues can appear again as your site changes. Upgrade to Pro to monitor more websites and catch regressions weekly.`,
      ctaHref: "/pricing",
      ctaLabel: "Start monitoring",
    };
  }

  if (loggedIn) {
    return {
      body: `${scope} Accessibility issues can appear again as your site changes. Upgrade to Starter or Pro to turn one-off checks into ongoing monitoring.`,
      ctaHref: "/pricing",
      ctaLabel: "Start monitoring",
    };
  }

  return {
    body: `${scope} Accessibility issues can appear again as your site changes. Create an account when you're ready to start monitoring.`,
    ctaHref: "/pricing",
    ctaLabel: "Start monitoring",
  };
}

function parseAiFlags(
  searchParams:
    | {
        aiEnabled?: string;
        aiUsageCurrent?: string;
        aiUsageLimit?: string;
        aiUsageRemaining?: string;
        requiresLoginForAI?: string;
        requiresUpgradeForAI?: string;
        aiLimitReached?: string;
      }
    | undefined,
) {
  return {
    aiEnabled: searchParams?.aiEnabled === "1",
    aiUsageCurrent: parseNonNegativeInt(searchParams?.aiUsageCurrent),
    aiUsageLimit: parseNonNegativeInt(searchParams?.aiUsageLimit),
    aiUsageRemaining: parseNonNegativeInt(searchParams?.aiUsageRemaining),
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
    return {
      mode: "visible" as const,
      aiUsageCurrent: apiAiFlags.aiUsageCurrent,
      aiUsageLimit: apiAiFlags.aiUsageLimit,
      aiUsageRemaining: apiAiFlags.aiUsageRemaining,
      aiLimitReached: apiAiFlags.aiLimitReached,
    };
  }

  if (apiAiFlags.requiresLoginForAI || (!userId && claimable)) {
    return {
      mode: "locked" as const,
      body: "Log in to see recommended fixes, save your scan, and keep tracking new accessibility regressions over time.",
      ctaHref: `/login?scanId=${encodeURIComponent(scanId)}`,
      ctaLabel: "Log in to see recommended fixes",
      aiUsageCurrent: null,
      aiUsageLimit: null,
      aiUsageRemaining: null,
      aiLimitReached: false,
    };
  }

  if (apiAiFlags.requiresUpgradeForAI || userPlan === "FREE") {
    return {
      mode: "locked" as const,
      body: "Upgrade to generate recommended fixes with legal rationale, plain-English steps, and copy-ready remediation guidance.",
      ctaHref: "/pricing",
      ctaLabel: "Get AI fixes",
      aiUsageCurrent: null,
      aiUsageLimit: null,
      aiUsageRemaining: null,
      aiLimitReached: false,
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
      ctaLabel: userPlan === "STARTER" ? "Get AI fixes" : undefined,
      aiUsageCurrent: apiAiFlags.aiUsageCurrent,
      aiUsageLimit: apiAiFlags.aiUsageLimit,
      aiUsageRemaining: apiAiFlags.aiUsageRemaining,
      aiLimitReached: true,
    };
  }

  return {
    mode: "locked" as const,
    body: "Recommended fixes are not available for this scan yet. Save it and re-scan from your dashboard to keep monitoring changes over time.",
    ctaHref: claimable ? `/login?scanId=${encodeURIComponent(scanId)}` : "/dashboard",
    ctaLabel: claimable ? "Start monitoring" : "Start monitoring",
    aiUsageCurrent: apiAiFlags.aiUsageCurrent,
    aiUsageLimit: apiAiFlags.aiUsageLimit,
    aiUsageRemaining: apiAiFlags.aiUsageRemaining,
    aiLimitReached: apiAiFlags.aiLimitReached,
  };
}

function parseNonNegativeInt(value: string | undefined): number | null {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}
