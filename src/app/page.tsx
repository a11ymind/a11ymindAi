import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { SiteHeader } from "@/components/SiteHeader";
import { URLScanner } from "@/components/URLScanner";

export const metadata: Metadata = {
  title: "a11ymind AI – Accessibility monitoring, CI checks, and AI fixes",
  description:
    "Scan live pages, monitor regressions, generate AI accessibility fixes, and share client-ready reports for websites and CI workflows.",
  openGraph: {
    title: "a11ymind AI – Accessibility monitoring, CI checks, and AI fixes",
    description:
      "Scan live pages, monitor regressions, generate AI accessibility fixes, and share client-ready reports for websites and CI workflows.",
    url: "/",
  },
  twitter: {
    title: "a11ymind AI – Accessibility monitoring, CI checks, and AI fixes",
    description:
      "Scan live pages, monitor regressions, generate AI accessibility fixes, and share client-ready reports for websites and CI workflows.",
  },
};

export default async function LandingPage() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="page-shell-gradient min-h-screen">
      {/* Hero */}
      <section aria-labelledby="hero-heading" className="relative overflow-hidden">
        <div className="aurora" aria-hidden="true" />
        <div className="grid-bg" aria-hidden="true" />

        <div className="container-page relative py-16 sm:py-24 md:py-28">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(420px,1.05fr)] lg:items-center">
            <div className="text-center md:text-left">
              <Link
                href="/pricing"
                className="group chip animate-fade-in-up transition-colors hover:border-accent/40 hover:text-text"
              >
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-pulse-soft rounded-full bg-accent" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
                </span>
                Accessibility monitoring, CI checks, and AI fixes
                <span className="text-accent opacity-60 transition-transform group-hover:translate-x-0.5">
                  →
                </span>
              </Link>

              <h1
                id="hero-heading"
                className="mt-7 max-w-4xl animate-fade-in-up text-balance text-[2.45rem] font-semibold leading-[0.98] tracking-[-0.055em] sm:text-5xl md:text-6xl lg:text-[4.9rem]"
              >
                <span className="shimmer-text">Operate accessibility</span>
                <br />
                <span className="gradient-text">like a product system.</span>
              </h1>
              <p
                className="mt-6 max-w-2xl animate-fade-in-up text-base text-text-muted sm:text-lg"
                style={{ animationDelay: "80ms" }}
              >
                Scan live pages, catch regressions, generate plain-English fixes, and share reports
                teams can act on before accessibility work turns into last-minute cleanup.
              </p>

              <div
                className="mt-10 flex w-full animate-fade-in-up justify-center md:justify-start"
                style={{ animationDelay: "140ms" }}
              >
                <URLScanner ctaLabel="Scan for free" />
              </div>

              <div
                className="mt-8 flex animate-fade-in-up flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-text-subtle md:justify-start"
                style={{ animationDelay: "200ms" }}
              >
                <TrustItem>No signup for first scan</TrustItem>
                <TrustItem>Preview and production workflows</TrustItem>
                <TrustItem>Plain-English remediation</TrustItem>
                <TrustItem>Reports for teams and clients</TrustItem>
              </div>

              <PricingAnchor className="mt-5 justify-center md:justify-start" />
            </div>

            <HeroSignalPanel />
          </div>

          <HeroProofStrip />
          <LogoStrip />
        </div>
      </section>

      {/* Problem / differentiation */}
      <section aria-labelledby="why-heading" className="container-page py-16 sm:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <Eyebrow>Why a11ymind AI</Eyebrow>
          <h2 id="why-heading" className="mt-3 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Most tools tell you what&apos;s wrong.{" "}
            <span className="gradient-text">a11ymind AI fixes it.</span>
          </h2>
          <p className="mt-4 text-base text-text-muted">
            Traditional scanners spit out a wall of technical violations. We translate each
            one into plain English, help your team act on it, and keep checking after the
            next release.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2">
          <ComparisonCard
            tone="muted"
            label="Typical accessibility tools"
            points={[
              "Raw automated findings with little prioritization",
              "Compliance jargon without product context",
              "One-time audit mindset that goes stale fast",
              "Your team still has to figure out what to do next",
            ]}
          />
          <ComparisonCard
            tone="accent"
            label="a11ymind AI"
            points={[
              "Plain-English explanation for every accessibility risk",
              "Actionable fix guidance your team can ship quickly",
              "Built for operators, agencies, and developers",
              "Ongoing monitoring instead of one-shot audits",
            ]}
          />
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" aria-labelledby="how-heading" className="container-page py-16 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <Eyebrow>How it works</Eyebrow>
          <h2 id="how-heading" className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Three steps. No setup.
          </h2>
          <p className="mt-4 text-base text-text-muted">
            From URL to pasteable fix in under a minute.
          </p>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          <FeatureCard
            step="01"
            title="Scan your website"
            body="Paste any public URL. We load it in real headless Chromium — no plugins, no installs, no SDK."
            icon={<ScanIcon />}
          />
          <FeatureCard
            step="02"
            title="See accessibility risks"
            body="Get an accessibility score and a ranked list of risks by severity, so you know what to tackle first."
            icon={<ListIcon />}
          />
          <FeatureCard
            step="03"
            title="Paste the fix"
            body="Each risk comes with a plain-English explanation and a concrete code snippet you can drop in."
            icon={<CodeIcon />}
          />
        </div>
      </section>

      {/* CI / DX showcase */}
      <CIShowcase />

      {/* Demo / value preview */}
      <section aria-labelledby="preview-heading" className="container-page py-16 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <Eyebrow>What you get</Eyebrow>
          <h2 id="preview-heading" className="mt-3 text-balance text-2xl font-semibold tracking-tight sm:text-4xl">
            A report you&apos;ll actually use.
          </h2>
          <p className="mt-4 text-sm text-text-muted sm:text-base">
            See what changed, what matters, and what to fix next without translating a wall
            of WCAG jargon into engineering work.
          </p>
        </div>
        <div className="mt-10 sm:mt-12">
          <ResultPreview />
        </div>
      </section>

      <section aria-labelledby="workflow-heading" className="container-page py-16 sm:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <Eyebrow>Built for shipping teams</Eyebrow>
          <h2 id="workflow-heading" className="mt-3 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            One workflow for preview checks and live monitoring.
          </h2>
          <p className="mt-4 text-base text-text-muted">
            a11ymind fits the modern delivery workflow: preview checks in CI, rescans on
            live sites, score history over time, and reports you can share internally or
            with clients.
          </p>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className="surface-premium rounded-[1.5rem] p-6">
            <p className="text-xs uppercase tracking-[0.18em] text-accent">CI workflow</p>
            <h3 className="mt-3 text-xl font-semibold tracking-tight">
              Catch accessibility regressions before merge.
            </h3>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-text-muted">
              Run AccessLint in GitHub Actions against preview URLs, fail the build at your
              chosen severity threshold, and upload JSON and Markdown artifacts for review.
            </p>
            <pre className="mt-5 overflow-x-auto rounded-xl border border-border bg-bg px-4 py-4 font-mono text-[11px] leading-relaxed text-text sm:text-xs">{`- uses: a11ymind/accesslint@v1
  with:
    url: https://preview.example.com
    fail-on: serious`}</pre>
          </div>
          <div className="rounded-[1.5rem] border border-white/10 bg-bg-elevated/45 p-6 shadow-card">
            <p className="text-xs uppercase tracking-[0.18em] text-accent">After launch</p>
            <h3 className="mt-3 text-xl font-semibold tracking-tight">
              Keep watching the site that users actually see.
            </h3>
            <ul className="mt-5 space-y-3 text-sm text-text-muted">
              <li className="flex items-start gap-3">
                <Dot />
                Scheduled rescans for monitored website pages
              </li>
              <li className="flex items-start gap-3">
                <Dot />
                Score history and regression visibility
              </li>
              <li className="flex items-start gap-3">
                <Dot />
                AI fixes and client-ready PDF reports on paid plans
              </li>
              <li className="flex items-start gap-3">
                <Dot />
                Monitoring badge for paid pages without fake compliance claims
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Real product surfaces */}
      <ProductTour />

      {/* Monitoring */}
      <section aria-labelledby="monitoring-heading" className="container-page py-16 sm:py-20">
        <div className="gradient-border relative mx-auto max-w-5xl rounded-2xl p-6 sm:p-10 md:p-12">
          <div className="grid gap-8 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] md:items-center">
            <div>
              <Eyebrow>Ongoing protection</Eyebrow>
              <h2 id="monitoring-heading" className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                Accessibility changes as your site changes.
              </h2>
              <p className="mt-4 text-base text-text-muted">
                A redesign, new template, form update, or CMS change can introduce fresh
                accessibility risks overnight. a11ymind re-scans monitored pages across your website on a schedule
                so your team can catch regressions before they become support, sales, or
                operational problems.
              </p>
              <ul className="mt-6 space-y-3 text-sm text-text">
                <li className="flex items-start gap-3">
                  <Dot /> Automatic weekly or daily re-scans on paid plans
                </li>
                <li className="flex items-start gap-3">
                  <Dot /> Track score trends and new-vs-fixed risks
                </li>
                <li className="flex items-start gap-3">
                  <Dot /> See what changed since the last scan
                </li>
                <li className="flex items-start gap-3">
                  <Dot /> Share reports and monitoring proof with confidence
                </li>
              </ul>
            </div>
            <div className="rounded-xl border border-border bg-bg-elevated/60 p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-wider text-text-subtle">
                  Score history
                </p>
                <span className="text-[10px] font-medium text-accent">+10 this week</span>
              </div>
              <SparkTrend />
              <p className="mt-3 text-xs text-text-subtle">
                Catch regressions the moment they ship.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" aria-labelledby="faq-heading" className="container-page py-16 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <Eyebrow>FAQ</Eyebrow>
          <h2 id="faq-heading" className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Questions we hear a lot.
          </h2>
        </div>
        <div className="mx-auto mt-10 max-w-3xl divide-y divide-border overflow-hidden rounded-2xl border border-border bg-bg-elevated/60">
          <FAQItem
            q="Do I need to install anything?"
            a="No. Paste a public URL and a11ymind AI loads it in real headless Chromium. For CI, we ship a GitHub Action — but you never need a browser plugin or SDK."
          />
          <FAQItem
            q="What rules do you cover?"
            a="We run axe-core against WCAG 2.0 / 2.1 A + AA plus best-practice rules — the same engine trusted by Google, Microsoft, and the U.S. federal government."
          />
          <FAQItem
            q="What can automated testing actually catch?"
            a="Automated testing is excellent for surfacing many high-impact issues such as missing alt text, color contrast failures, label problems, ARIA misuse, and landmark issues. It is not a substitute for manual keyboard, screen reader, and usability review."
          />
          <FAQItem
            q="Can I really fix issues without being an expert?"
            a="Yes. Every violation gets a plain-English explanation and a concrete code snippet. Copy, paste, re-scan."
          />
          <FAQItem
            q="Who is a11ymind best for?"
            a="It works best for SaaS teams, agencies, ecommerce operators, and lean teams that need faster accessibility feedback without turning every scan into a specialist-only task."
          />
          <FAQItem
            q="Is this a substitute for a legal accessibility audit?"
            a="No. a11ymind AI automates the 30–40% of WCAG that can be tested automatically, which catches the bulk of real-world issues. For formal conformance, you still want a manual audit."
          />
          <FAQItem
            q="Do you modify my site?"
            a="Never. We respect robots.txt, identify as a11ymindBot, and load pages read-only in headless Chromium."
          />
        </div>
      </section>

      {/* Final CTA */}
      <section aria-labelledby="cta-heading" className="container-page py-16 sm:py-24">
        <div className="surface-premium mx-auto flex max-w-4xl flex-col items-center rounded-[1.75rem] p-6 text-center sm:p-10 md:p-14">
          <h2 id="cta-heading" className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Start with one page.{" "}
            <span className="gradient-text">Stay ahead of what changes after.</span>
          </h2>
          <p className="mt-4 max-w-xl text-base text-text-muted">
            Run a free scan now, then upgrade when you want AI fixes, ongoing monitoring,
            and reports you can share.
          </p>
          <div className="mt-8 flex w-full justify-center">
            <URLScanner ctaLabel="Scan for free" />
          </div>
          <PricingAnchor className="mt-5 justify-center" />
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-text-subtle">
            <Link href="/pricing" className="transition-colors hover:text-text">
              See plans →
            </Link>
            <a
              href="https://github.com/a11ymind/accesslint"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-text"
            >
              Use AccessLint in CI →
            </a>
          </div>
        </div>
      </section>

      </main>
      <SiteFooter />
    </>
  );
}

/* ---------------- Subcomponents ---------------- */

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-accent">
      <span className="h-px w-6 bg-accent/60" />
      {children}
    </p>
  );
}

function TrustItem({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 text-accent" fill="none" aria-hidden="true">
        <path
          d="m4 10 4 4 8-8"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {children}
    </span>
  );
}

function HeroProofStrip() {
  const steps = [
    { title: "Scan", body: "Real-browser checks against live and preview URLs." },
    { title: "Fix", body: "Plain-English guidance and pasteable remediation." },
    { title: "Monitor", body: "Scheduled page checks with regression history." },
    { title: "Report", body: "Shareable proof for teams, clients, and releases." },
  ];

  return (
    <div className="mt-12 w-full rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-3 shadow-card backdrop-blur-sm sm:p-4">
      <div className="grid gap-px overflow-hidden rounded-[1.1rem] border border-white/10 bg-white/10 sm:grid-cols-2 xl:grid-cols-4">
        {steps.map((step, idx) => (
          <div key={step.title} className="bg-bg/75 px-4 py-5 text-left backdrop-blur-sm">
            <p className="section-kicker">
              0{idx + 1}
            </p>
            <h3 className="mt-2 text-sm font-semibold text-text">{step.title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-text-muted">{step.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function LogoStrip() {
  const items = [
    "ADA Title III",
    "WCAG 2.1 AA",
    "Section 508",
    "EN 301 549",
    "EAA 2025",
    "axe-core",
  ];
  return (
    <div className="mt-14 w-full">
      <p className="text-center text-xs uppercase tracking-[0.18em] text-text-subtle">
        Designed around the standards teams actually get asked about
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 border-y border-border/60 py-5">
        {items.map((i) => (
          <span
            key={i}
            className="font-mono text-xs text-text-muted/80 transition-colors hover:text-text"
          >
            {i}
          </span>
        ))}
      </div>
      <p className="mx-auto mt-5 max-w-2xl text-center text-xs leading-relaxed text-text-subtle">
        Automated testing catches many high-impact issues quickly, but it does not replace
        manual accessibility review for full conformance or legal sign-off.
      </p>
    </div>
  );
}

function StatCell({ value, label }: { value: string; label: string }) {
  return (
    <div className="relative bg-bg-elevated/60 px-6 py-6 text-center sm:px-8 sm:py-7">
      <div className="text-2xl font-semibold tracking-tight text-text sm:text-3xl">
        <span className="gradient-text">{value}</span>
      </div>
      <p className="mt-1 text-xs uppercase tracking-wider text-text-subtle">{label}</p>
    </div>
  );
}

function FeatureCard({
  step,
  title,
  body,
  icon,
}: {
  step: string;
  title: string;
  body: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="card card-hover group relative overflow-hidden p-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-accent/10 opacity-0 blur-3xl transition-opacity group-hover:opacity-100"
      />
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-bg-muted text-accent">
          {icon}
        </div>
        <span className="font-mono text-[11px] uppercase tracking-wider text-text-subtle">
          {step}
        </span>
      </div>
      <h3 className="mb-2 text-lg font-semibold tracking-tight">{title}</h3>
      <p className="text-sm leading-relaxed text-text-muted">{body}</p>
    </div>
  );
}

function ComparisonCard({
  tone,
  label,
  points,
}: {
  tone: "muted" | "accent";
  label: string;
  points: string[];
}) {
  const isAccent = tone === "accent";
  return (
    <div
      className={`card relative p-6 ${
        isAccent
          ? "border-accent/40 shadow-glow ring-1 ring-accent/20"
          : "border-border"
      }`}
    >
      {isAccent && (
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/70 to-transparent"
        />
      )}
      <div className="flex items-center justify-between">
        <p
          className={`text-xs uppercase tracking-[0.18em] ${
            isAccent ? "text-accent" : "text-text-subtle"
          }`}
        >
          {label}
        </p>
        {isAccent && (
          <span className="rounded-full border border-accent/40 bg-accent/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent">
            Recommended
          </span>
        )}
      </div>
      <ul className="mt-5 space-y-3 text-sm">
        {points.map((p) => (
          <li key={p} className="flex items-start gap-3">
            {isAccent ? <CheckIcon /> : <DashIcon />}
            <span className={isAccent ? "text-text" : "text-text-muted"}>{p}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ResultPreview() {
  return (
    <div className="surface-premium mx-auto max-w-5xl rounded-[1.75rem] p-0">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-bg/45 px-4 py-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-2">
          <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full bg-severity-critical/80" />
          <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full bg-severity-moderate/80" />
          <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full bg-accent/80" />
          <span className="ml-2 truncate font-mono text-xs text-text-subtle sm:ml-3">
            a11ymind.ai/scan/preview
          </span>
        </div>
        <span className="hidden flex-shrink-0 text-[10px] uppercase tracking-[0.18em] text-text-subtle sm:inline">
          Preview
        </span>
      </div>

      <div className="grid gap-4 p-3 sm:gap-6 sm:p-6 md:grid-cols-[minmax(0,240px)_minmax(0,1fr)]">
        <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-bg/55 p-4 md:flex-col md:items-center md:justify-center md:gap-0 md:p-5">
          <ScoreDial score={62} />
          <div className="flex flex-col md:mt-3 md:items-center">
            <p className="section-kicker">
              Accessibility score
            </p>
            <p className="text-sm font-semibold text-severity-moderate">Needs work</p>
          </div>
        </div>

        <div className="space-y-3 sm:space-y-4">
          <div>
            <p className="mb-2 text-xs uppercase tracking-wider text-text-subtle">
              Risks detected
            </p>
            <div className="mb-3 flex flex-wrap items-center gap-2 text-[11px] text-text-subtle">
              <span className="rounded-full border border-accent/20 bg-accent/10 px-2 py-1 text-accent">
                +5 points since last scan
              </span>
              <span>New risks: 2</span>
              <span>Fixed risks: 4</span>
            </div>
            <div className="space-y-2">
              <RiskRow impact="critical" label="Images missing alt text" count={4} />
              <RiskRow impact="serious" label="Insufficient color contrast" count={7} />
              <RiskRow impact="moderate" label="Form inputs without labels" count={2} />
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-bg/60 p-3 sm:p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[11px] uppercase tracking-wider text-accent sm:text-xs">
                Recommended fix
              </p>
              <span className="inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-accent">
                <LockIcon /> Claude AI
              </span>
            </div>
            <p className="mt-3 text-sm text-text">
              <span className="font-semibold">Images missing alt text</span> — screen
              readers skip these, blocking visually impaired users.
            </p>
            <p className="mt-2 hidden text-sm text-text-muted sm:block">
              Add a descriptive <code className="font-mono text-accent">alt</code>{" "}
              attribute that explains what the image conveys.
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="rounded-md border border-border bg-bg px-3 py-3">
                <p className="text-[10px] uppercase tracking-wider text-text-subtle">Before</p>
                <pre className="mt-2 whitespace-pre-wrap break-all font-mono text-[11px] leading-relaxed text-text-muted sm:text-xs">{`<img src="/hero.png" />`}</pre>
              </div>
              <div className="rounded-md border border-border bg-bg px-3 py-3">
                <p className="text-[10px] uppercase tracking-wider text-accent">After</p>
                <pre className="mt-2 whitespace-pre-wrap break-all font-mono text-[11px] leading-relaxed text-text sm:text-xs">{`<img src="/hero.png"
  alt="Team celebrating product launch" />`}</pre>
              </div>
            </div>
            <pre className="mt-3 whitespace-pre-wrap break-all rounded-md border border-border bg-bg p-3 font-mono text-[11px] leading-relaxed text-text sm:text-xs">
{`Copy fix
⏱ Takes ~1 minute to fix
✔ Based on accessibility guidelines`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

function ScoreDial({ score }: { score: number }) {
  const radius = 42;
  const circ = 2 * Math.PI * radius;
  const offset = circ * (1 - score / 100);
  return (
    <div className="relative h-20 w-20 flex-shrink-0 md:h-28 md:w-28">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
        <defs>
          <linearGradient id="score-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#f97316" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r={radius} stroke="#1f1f23" strokeWidth="7" fill="none" />
        <circle
          cx="50"
          cy="50"
          r={radius}
          stroke="url(#score-grad)"
          strokeWidth="7"
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circ}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-semibold tabular-nums md:text-2xl">{score}</span>
        <span className="text-[8px] uppercase tracking-wider text-text-subtle md:text-[9px]">
          / 100
        </span>
      </div>
    </div>
  );
}

function RiskRow({
  impact,
  label,
  count,
}: {
  impact: "critical" | "serious" | "moderate";
  label: string;
  count: number;
}) {
  const color =
    impact === "critical"
      ? "bg-severity-critical"
      : impact === "serious"
        ? "bg-severity-serious"
        : "bg-severity-moderate";
  const labelText =
    impact === "critical" ? "Critical" : impact === "serious" ? "Serious" : "Moderate";
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-bg-muted/50 px-3 py-2 transition-colors hover:border-border-strong">
      <div className="flex min-w-0 items-center gap-3">
        <span className={`h-2 w-2 flex-shrink-0 rounded-full ${color}`} />
        <span className="truncate text-sm text-text">{label}</span>
      </div>
      <div className="flex flex-shrink-0 items-center gap-3 text-xs text-text-subtle">
        <span className="hidden sm:inline">{labelText}</span>
        <span className="tabular-nums text-text">{count}</span>
      </div>
    </div>
  );
}

function SparkTrend() {
  const points = [78, 74, 77, 69, 63, 68, 72, 85, 88];
  const w = 320;
  const h = 90;
  const max = 100;
  const step = w / (points.length - 1);
  const d = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${i * step} ${h - (p / max) * h}`)
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="mt-4 h-24 w-full" aria-hidden="true">
      <defs>
        <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${d} L ${w} ${h} L 0 ${h} Z`} fill="url(#sparkFill)" />
      <path d={d} fill="none" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round" />
      {points.map((p, i) => (
        <circle
          key={i}
          cx={i * step}
          cy={h - (p / max) * h}
          r={i === points.length - 1 ? 3 : 1.5}
          fill={i === points.length - 1 ? "#22d3ee" : "#06b6d4"}
        />
      ))}
    </svg>
  );
}

function FAQItem({ q, a }: { q: string; a: string }) {
  return (
    <details className="group px-6 py-5 transition-colors hover:bg-bg-elevated/40">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left">
        <span className="text-sm font-medium text-text sm:text-base">{q}</span>
        <span
          aria-hidden="true"
          className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border border-border text-text-muted transition-transform group-open:rotate-45"
        >
          +
        </span>
      </summary>
      <p className="mt-3 text-sm leading-relaxed text-text-muted">{a}</p>
    </details>
  );
}

function AudienceCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-border bg-bg-elevated/30 p-6">
      <p className="text-sm font-semibold uppercase tracking-[0.14em] text-text">{title}</p>
      <p className="mt-3 text-sm leading-relaxed text-text-muted">{body}</p>
    </div>
  );
}

function QuoteCard({
  quote,
  person,
  role,
}: {
  quote: string;
  person: string;
  role: string;
}) {
  return (
    <figure className="rounded-2xl border border-border bg-bg-elevated/20 p-6">
      <blockquote className="text-sm leading-relaxed text-text">
        <span className="text-accent">&ldquo;</span>
        {quote}
        <span className="text-accent">&rdquo;</span>
      </blockquote>
      <figcaption className="mt-5 text-xs text-text-muted">
        <span className="font-medium text-text">{person}</span> — {role}
      </figcaption>
    </figure>
  );
}

function HeroSignalPanel() {
  return (
    <div className="relative">
      <div
        aria-hidden="true"
        className="absolute inset-0 rounded-[2rem] bg-[radial-gradient(circle_at_top,rgba(6,182,212,0.28),transparent_55%),radial-gradient(circle_at_bottom_right,rgba(245,158,11,0.13),transparent_42%)] blur-2xl"
      />
      <div className="surface-premium rounded-[1.85rem] p-5 lg:p-7">
        <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <p className="section-kicker">
              Live operating view
            </p>
            <p className="mt-1 text-sm font-medium text-text">
              Production pages + preview checks
            </p>
          </div>
          <span className="rounded-full border border-accent/25 bg-accent/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-accent">
            Active
          </span>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-[0.82fr_1fr]">
          <div className="rounded-2xl border border-white/10 bg-bg/60 p-4">
            <p className="section-kicker">Project health</p>
            <p className="mt-2 text-5xl font-semibold tracking-[-0.06em] text-text">82</p>
            <p className="text-sm text-accent">+7 points this week</p>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-[82%] rounded-full bg-gradient-to-r from-accent to-accent-glow" />
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-bg/45 p-4">
            <p className="section-kicker">This release</p>
            <div className="mt-2 space-y-2 text-sm text-text">
              <p className="flex items-center justify-between">
                <span>Pages monitored</span>
                <span className="font-medium text-text">24</span>
              </p>
              <p className="flex items-center justify-between">
                <span>New affected locations</span>
                <span className="font-medium text-text">2</span>
              </p>
              <p className="flex items-center justify-between">
                <span>Fixed this week</span>
                <span className="font-medium text-accent">11</span>
              </p>
              <p className="flex items-center justify-between">
                <span>Worst page</span>
                <span className="font-medium text-severity-moderate">Checkout</span>
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-bg/55">
          <div className="border-b border-white/10 px-4 py-3">
            <p className="section-kicker">Fix queue</p>
          </div>
          <div className="divide-y divide-white/10">
            {[
              ["Critical", "Button has no accessible name", "button.checkout-primary"],
              ["Serious", "Form input missing label", "#billing-email"],
              ["Moderate", "Low contrast helper text", ".promo-disclaimer"],
            ].map(([impact, issue, selector]) => (
              <div key={selector} className="px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium text-text">{issue}</p>
                  <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-text-subtle">
                    {impact}
                  </span>
                </div>
                <code className="mt-2 block truncate font-mono text-xs text-accent">{selector}</code>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-4 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 text-center">
          {["Scan", "Fix", "Rescan", "Share"].map((item) => (
            <div key={item} className="bg-bg/70 px-3 py-3">
              <p className="text-[10px] uppercase tracking-[0.16em] text-text-subtle">{item}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SiteFooter() {
  return (
    <footer className="mt-10 border-t border-border">
      <div className="container-page grid gap-8 py-12 md:grid-cols-[1.2fr_repeat(3,minmax(0,1fr))]">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm text-text-muted">
            AI-powered ADA / WCAG 2.1 AA accessibility scanning for teams that can&apos;t
            afford a six-figure audit.
          </p>
        </div>
        <FooterCol
          title="Product"
          links={[
            { href: "/#how-it-works", label: "How it works" },
            { href: "/pricing", label: "Pricing" },
            { href: "/#faq", label: "FAQ" },
          ]}
        />
        <FooterCol
          title="Account"
          links={[
            { href: "/login", label: "Log in" },
            { href: "/signup", label: "Create account" },
            { href: "/dashboard", label: "Dashboard" },
          ]}
        />
        <FooterCol
          title="Resources"
          links={[
            { href: "/privacy", label: "Privacy Policy" },
            { href: "/terms", label: "Terms of Service" },
            { href: "https://www.w3.org/WAI/WCAG21/quickref/", label: "WCAG 2.1 quickref", external: true },
            { href: "https://www.ada.gov/", label: "ADA.gov", external: true },
          ]}
        />
      </div>
      <div className="container-page flex flex-col items-center justify-between gap-3 border-t border-border/60 py-6 text-xs text-text-subtle sm:flex-row">
        <p>© {new Date().getFullYear()} a11ymind AI — All rights reserved.</p>
        <p className="font-mono">made for teams shipping accessible software.</p>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string; external?: boolean }[];
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-subtle">
        {title}
      </p>
      <ul className="mt-4 space-y-2 text-sm">
        {links.map((l) => (
          <li key={l.href}>
            {l.external ? (
              <a
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-text-muted transition-colors hover:text-text"
              >
                {l.label}
              </a>
            ) : (
              <Link
                href={l.href}
                className="text-text-muted transition-colors hover:text-text"
              >
                {l.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------------- Icons ---------------- */

function CheckIcon() {
  return (
    <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
      <svg className="h-3 w-3" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path
          d="m4 10 4 4 8-8"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

function DashIcon() {
  return (
    <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border border-border text-text-subtle">
      <svg className="h-3 w-3" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="M5 10h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </span>
  );
}

function Dot() {
  return (
    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent shadow-[0_0_6px_rgba(6,182,212,0.8)]" />
  );
}

function LockIcon() {
  return (
    <svg className="h-3 w-3" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect
        x="4"
        y="9"
        width="12"
        height="8"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path d="M7 9V6a3 3 0 1 1 6 0v3" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function ScanIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 8V6a2 2 0 0 1 2-2h2M20 8V6a2 2 0 0 0-2-2h-2M4 16v2a2 2 0 0 0 2 2h2M20 16v2a2 2 0 0 1-2 2h-2M3 12h18"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CodeIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="m8 16-4-4 4-4m8 0 4 4-4 4M14 4l-4 16"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ---------------- Pricing anchor ---------------- */

function PricingAnchor({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-muted ${className}`}
    >
      <span className="inline-flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-text-subtle" />
        <span className="text-text">Free</span> forever
      </span>
      <span className="text-text-subtle">·</span>
      <span>
        Starter <span className="tabular-nums text-text">$25</span>/mo
      </span>
      <span className="text-text-subtle">·</span>
      <span>
        Pro <span className="tabular-nums text-text">$65</span>/mo
      </span>
      <Link
        href="/pricing"
        className="inline-flex items-center gap-1 text-accent transition-colors hover:text-accent-glow"
      >
        Compare plans
        <span aria-hidden>→</span>
      </Link>
    </div>
  );
}

/* ---------------- Stack row ---------------- */

function StackRow() {
  const stacks = [
    "GitHub Actions",
    "Next.js",
    "Vercel",
    "Netlify",
    "React",
    "Vue",
    "Shopify",
    "Webflow",
    "WordPress",
    "Cloudflare",
  ];
  return (
    <section aria-label="Supported stacks" className="container-page pb-12 pt-4 sm:pt-6">
      <p className="text-center text-xs uppercase tracking-[0.18em] text-text-subtle">
        Works with any stack — we scan what you ship
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-3 sm:gap-x-8">
        {stacks.map((s) => (
          <span
            key={s}
            className="font-mono text-xs text-text-muted/80 transition-colors hover:text-text"
          >
            {s}
          </span>
        ))}
      </div>
    </section>
  );
}

/* ---------------- CI / DX showcase ---------------- */

function CIShowcase() {
  return (
    <section
      aria-labelledby="ci-heading"
      className="container-page py-16 sm:py-20"
    >
      <div className="mx-auto max-w-3xl text-center">
        <Eyebrow>Built for CI</Eyebrow>
        <h2
          id="ci-heading"
          className="mt-3 text-balance text-3xl font-semibold tracking-tight sm:text-4xl"
        >
          Catch regressions{" "}
          <span className="gradient-text">before they merge.</span>
        </h2>
        <p className="mt-4 text-sm text-text-muted sm:text-base">
          The AccessLint GitHub Action runs on every PR. Fail the build on new
          serious issues, upload reports as artifacts, and review AI fixes next to
          the diff that introduced the regression.
        </p>
      </div>

      <div className="mx-auto mt-12 grid max-w-5xl gap-5 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <TerminalCard />
        <DiffCard />
      </div>

      <GitHubCheckBar />
    </section>
  );
}

function TerminalCard() {
  return (
    <div className="card overflow-hidden p-0">
      <div className="flex items-center gap-2 border-b border-border bg-bg-muted/60 px-4 py-2">
        <span className="h-2.5 w-2.5 rounded-full bg-severity-critical/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-severity-moderate/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-accent/80" />
        <span className="ml-2 font-mono text-[11px] text-text-subtle">
          .github/workflows/a11ymind.yml
        </span>
      </div>
      <pre className="overflow-x-auto px-4 py-4 font-mono text-[12px] leading-relaxed text-text sm:text-[13px]">
{`$ gh run view --log
`}<span className="text-text-subtle">{`▸ `}</span>{`Launching headless Chromium…
`}<span className="text-text-subtle">{`▸ `}</span>{`Loading https://preview-42.vercel.app
`}<span className="text-text-subtle">{`▸ `}</span>{`Running 90+ WCAG 2.1 AA checks…
`}<span className="text-severity-moderate">{`⚠`}</span>{` 2 moderate risks found
`}<span className="text-accent">{`✓`}</span>{` AccessLint scan complete`}
        <br />
        <span className="text-accent">
{`  score 96/100  ·  crit 0 · serious 0 · mod 2 · minor 0`}
        </span>
        <br />
        <span className="text-text-muted">{`  report → .accesslint/accesslint-report.json`}</span>
      </pre>
    </div>
  );
}

function DiffCard() {
  return (
    <div className="card overflow-hidden p-0">
      <div className="flex items-center justify-between border-b border-border bg-bg-muted/60 px-4 py-2">
        <span className="font-mono text-[11px] text-text-subtle">
          src/components/Hero.tsx
        </span>
        <span className="inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-accent">
          <LockIcon /> AI fix
        </span>
      </div>
      <pre className="overflow-x-auto px-4 py-4 font-mono text-[12px] leading-relaxed sm:text-[13px]">
        <span className="text-severity-critical">
{`- <img src="/hero.png" />`}
        </span>
        <br />
        <span className="text-accent">
{`+ <img src="/hero.png"
+      alt="Team celebrating product launch" />`}
        </span>
        <br />
        <br />
        <span className="text-text-subtle">
{`// WCAG 1.1.1 · rule: image-alt
// screen readers skip unlabeled images`}
        </span>
      </pre>
    </div>
  );
}

function GitHubCheckBar() {
  return (
    <div className="mx-auto mt-5 max-w-5xl">
      <div className="card flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5">
        <div className="flex items-center gap-3">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
            <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path
                d="m4 10 4 4 8-8"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-text">
              All checks have passed ·{" "}
              <span className="font-mono text-text-muted">AccessLint / scan</span>
            </p>
            <p className="text-xs text-text-subtle">
              score 96/100 · 2 moderate · no blockers on this PR
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 rounded-md border border-emerald-400/30 bg-emerald-500/10 px-2 py-1 font-mono text-[11px] font-medium text-emerald-400">
          ✓ Ready to merge
        </span>
      </div>
    </div>
  );
}

/* ---------------- Product tour ---------------- */

function ProductTour() {
  return (
    <section
      aria-labelledby="tour-heading"
      className="container-page py-16 sm:py-20"
    >
      <div className="mx-auto max-w-3xl text-center">
        <Eyebrow>Real product surfaces</Eyebrow>
        <h2
          id="tour-heading"
          className="mt-3 text-balance text-3xl font-semibold tracking-tight sm:text-4xl"
        >
          One scan feeds every view your team needs.
        </h2>
        <p className="mt-4 text-sm text-text-muted sm:text-base">
          Same data, different surfaces — a dashboard for engineering, a shareable
          report for clients, a monitoring badge for your public site.
        </p>
      </div>

      <div className="mt-12 grid gap-5 lg:grid-cols-3">
        <TourCard label="Dashboard · score history" caption="Track every monitored page over time, with deltas on every scan.">
          <DashboardPreview />
        </TourCard>
        <TourCard label="PDF · client-ready report" caption="One-click export with your score, risk breakdown, and recommended fixes.">
          <PdfPreview />
        </TourCard>
        <TourCard label="Badge · monitoring proof" caption="Drop a live monitoring badge on your footer once you start monitoring.">
          <BadgePreview />
        </TourCard>
      </div>
    </section>
  );
}

function TourCard({
  label,
  caption,
  children,
}: {
  label: string;
  caption: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card card-hover overflow-hidden p-0">
      <div className="border-b border-border bg-bg-muted/60 px-4 py-2.5">
        <p className="text-[11px] uppercase tracking-[0.18em] text-text-subtle">
          {label}
        </p>
      </div>
      <div className="p-5">{children}</div>
      <div className="border-t border-border bg-bg/40 px-5 py-3">
        <p className="text-xs text-text-muted">{caption}</p>
      </div>
    </div>
  );
}

function DashboardPreview() {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-text-subtle">
            Current score
          </p>
          <p className="mt-1 text-3xl font-semibold tabular-nums text-accent">88</p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-accent">
          +10 wk
        </span>
      </div>
      <SparkTrend />
      <div className="mt-3 space-y-1.5 text-[11px]">
        <MiniSiteRow host="acme.com" score={88} tone="good" />
        <MiniSiteRow host="blog.acme.com" score={74} tone="warn" />
        <MiniSiteRow host="shop.acme.com" score={92} tone="good" />
      </div>
    </div>
  );
}

function MiniSiteRow({
  host,
  score,
  tone,
}: {
  host: string;
  score: number;
  tone: "good" | "warn" | "bad";
}) {
  const color =
    tone === "good"
      ? "text-accent"
      : tone === "warn"
        ? "text-severity-moderate"
        : "text-severity-critical";
  return (
    <div className="flex items-center justify-between gap-2 rounded-md border border-border bg-bg-muted/40 px-2.5 py-1.5">
      <span className="truncate font-mono text-text">{host}</span>
      <span className={`tabular-nums font-semibold ${color}`}>{score}</span>
    </div>
  );
}

function PdfPreview() {
  return (
    <div className="rounded-md border border-border bg-bg/60 p-4">
      <div className="flex items-center justify-between border-b border-border/60 pb-2">
        <p className="font-mono text-[10px] uppercase tracking-wider text-accent">
          a11ymind AI · audit report
        </p>
        <p className="font-mono text-[10px] text-text-subtle">PDF</p>
      </div>
      <p className="mt-3 text-sm font-semibold text-text">acme.com / home</p>
      <p className="text-[11px] text-text-subtle">Generated · scan #147</p>
      <div className="mt-4 grid grid-cols-4 gap-2 text-center">
        <PdfStat label="Score" value="88" tone="accent" />
        <PdfStat label="Crit" value="0" tone="muted" />
        <PdfStat label="Ser" value="1" tone="warn" />
        <PdfStat label="Mod" value="3" tone="muted" />
      </div>
      <div className="mt-4 space-y-1.5">
        <div className="h-1.5 w-full rounded-full bg-border/60" />
        <div className="h-1.5 w-[82%] rounded-full bg-border/60" />
        <div className="h-1.5 w-[65%] rounded-full bg-border/60" />
        <div className="h-1.5 w-[90%] rounded-full bg-border/60" />
      </div>
    </div>
  );
}

function PdfStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "accent" | "warn" | "muted";
}) {
  const color =
    tone === "accent"
      ? "text-accent"
      : tone === "warn"
        ? "text-severity-serious"
        : "text-text";
  return (
    <div className="rounded-md border border-border bg-bg-muted/40 px-1.5 py-1.5">
      <p className={`text-base font-semibold tabular-nums ${color}`}>{value}</p>
      <p className="text-[9px] uppercase tracking-wider text-text-subtle">{label}</p>
    </div>
  );
}

function BadgePreview() {
  return (
    <div className="flex h-full flex-col justify-between gap-5">
      <div className="rounded-md border border-accent/30 bg-bg/60 p-4 shadow-glow">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-accent/15 text-accent">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M12 2 4 5v6c0 5 3.5 9 8 10 4.5-1 8-5 8-10V5l-8-3Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              <path
                d="m8.5 12 2.5 2.5L16 9"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-text-subtle">
              Accessibility monitored
            </p>
            <p className="text-sm font-semibold text-text">a11ymind AI · 88/100</p>
          </div>
        </div>
      </div>
      <div className="rounded-md border border-border bg-bg-muted/40 p-3">
        <p className="font-mono text-[10px] text-text-subtle">embed.html</p>
        <pre className="mt-1.5 overflow-x-auto whitespace-pre-wrap break-all font-mono text-[10px] leading-relaxed text-text-muted">
{`<a href="https://www.a11ymind.ai">
  <img src=".../badge/abc" alt="…" />
</a>`}
        </pre>
      </div>
    </div>
  );
}
