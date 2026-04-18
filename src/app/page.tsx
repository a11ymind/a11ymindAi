import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { SiteHeader } from "@/components/SiteHeader";
import { URLScanner } from "@/components/URLScanner";

export const metadata: Metadata = {
  title: "a11ymind AI – Accessibility Testing for CI & Production Sites",
  description:
    "AI-powered accessibility scanning, monitoring, reports, and fixes for websites and CI workflows. ADA / WCAG 2.1 AA coverage in seconds.",
};

export default async function LandingPage() {
  return (
    <main className="min-h-screen">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="aurora" aria-hidden="true" />
        <div className="grid-bg" aria-hidden="true" />

        <div className="container-page relative flex flex-col items-center py-20 text-center sm:py-28">
          <Link
            href="/pricing"
            className="group chip mb-7 animate-fade-in-up transition-colors hover:border-accent/40 hover:text-text"
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-pulse-soft rounded-full bg-accent" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
            </span>
            New — AI fixes for ADA / WCAG 2.1 AA
            <span className="text-accent opacity-60 transition-transform group-hover:translate-x-0.5">
              →
            </span>
          </Link>

          <h1 className="max-w-4xl animate-fade-in-up text-balance text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl md:text-7xl">
            <span className="shimmer-text">Ship accessible sites</span>
            <br />
            <span className="gradient-text">before a lawsuit finds them.</span>
          </h1>
          <p
            className="mt-6 max-w-xl animate-fade-in-up text-base text-text-muted sm:text-lg"
            style={{ animationDelay: "80ms" }}
          >
            Paste any URL. a11ymind AI runs 90+ WCAG checks in a real browser and hands
            back plain-English fixes your team can ship today — no specialist required.
          </p>

          <div
            className="mt-10 flex w-full animate-fade-in-up justify-center"
            style={{ animationDelay: "140ms" }}
          >
            <URLScanner />
          </div>

          <div
            className="mt-8 flex animate-fade-in-up flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-text-subtle"
            style={{ animationDelay: "200ms" }}
          >
            <TrustItem>No credit card</TrustItem>
            <TrustItem>Results in seconds</TrustItem>
            <TrustItem>Plain-English fixes</TrustItem>
            <TrustItem>Works in CI</TrustItem>
          </div>

          <LogoStrip />
        </div>
      </section>

      {/* Stats strip */}
      <section className="container-page -mt-6 pb-8">
        <div className="card grid grid-cols-2 divide-border/60 overflow-hidden rounded-2xl p-0 md:grid-cols-4 md:divide-x">
          <StatCell value="90+" label="WCAG 2.1 rules checked" />
          <StatCell value="<45s" label="Average scan time" />
          <StatCell value="1-click" label="Plain-English AI fixes" />
          <StatCell value="$0" label="To run your first scan" />
        </div>
      </section>

      {/* Problem / differentiation */}
      <section className="container-page py-20">
        <div className="mx-auto max-w-3xl text-center">
          <Eyebrow>Why a11ymind AI</Eyebrow>
          <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Most tools tell you what&apos;s wrong.{" "}
            <span className="gradient-text">a11ymind AI fixes it.</span>
          </h2>
          <p className="mt-4 text-base text-text-muted">
            Traditional scanners spit out a wall of technical violations. We translate each
            one into plain English and hand you the exact code to paste.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2">
          <ComparisonCard
            tone="muted"
            label="Typical accessibility tools"
            points={[
              "Walls of jargon-heavy violations",
              "Raw WCAG references with no context",
              "Built for accessibility specialists",
              "You still have to guess the fix",
            ]}
          />
          <ComparisonCard
            tone="accent"
            label="a11ymind AI"
            points={[
              "Plain-English explanation for every risk",
              "Copy-pasteable code fix, per violation",
              "Built for founders, designers, developers",
              "Ongoing monitoring — not a one-shot audit",
            ]}
          />
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="container-page py-20">
        <div className="mx-auto max-w-2xl text-center">
          <Eyebrow>How it works</Eyebrow>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
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
            body="Get a compliance score and a ranked list of risks by severity, so you know what to tackle first."
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

      {/* Demo / value preview */}
      <section className="container-page py-20">
        <div className="mx-auto max-w-2xl text-center">
          <Eyebrow>What you get</Eyebrow>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            A report you&apos;ll actually use.
          </h2>
          <p className="mt-4 text-base text-text-muted">
            Not a 40-page PDF of line items. A focused view of what&apos;s risky, why it
            matters, and how to fix it.
          </p>
        </div>
        <div className="mt-12">
          <ResultPreview />
        </div>
      </section>

      {/* Monitoring */}
      <section className="container-page py-20">
        <div className="gradient-border relative mx-auto max-w-5xl rounded-2xl p-8 sm:p-12">
          <div className="grid gap-8 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] md:items-center">
            <div>
              <Eyebrow>Ongoing protection</Eyebrow>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                Accessibility isn&apos;t a one-time fix.
              </h2>
              <p className="mt-4 text-base text-text-muted">
                Websites change. A new template, a redesigned hero, an added form — any of
                them can introduce new accessibility risks overnight. a11ymind AI re-scans
                your saved sites on a schedule and flags regressions before users (or
                lawyers) do.
              </p>
              <ul className="mt-6 space-y-3 text-sm text-text">
                <li className="flex items-start gap-3">
                  <Dot /> Automatic weekly or monthly re-scans
                </li>
                <li className="flex items-start gap-3">
                  <Dot /> Track your compliance score over time
                </li>
                <li className="flex items-start gap-3">
                  <Dot /> Get notified when something regresses
                </li>
                <li className="flex items-start gap-3">
                  <Dot /> Drop a monitoring badge on your footer
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

      {/* Testimonial */}
      <section className="container-page py-16">
        <figure className="mx-auto max-w-3xl text-center">
          <blockquote className="text-balance text-xl font-medium leading-snug text-text sm:text-2xl">
            <span className="text-accent">&ldquo;</span>
            Our CI caught three serious WCAG regressions the week before launch. a11ymind
            paid for itself before we finished the free trial.
            <span className="text-accent">&rdquo;</span>
          </blockquote>
          <figcaption className="mt-5 text-sm text-text-muted">
            <span className="font-medium text-text">Maya Chen</span> — Staff Engineer,
            SaaS startup
          </figcaption>
        </figure>
      </section>

      {/* FAQ */}
      <section id="faq" className="container-page py-20">
        <div className="mx-auto max-w-2xl text-center">
          <Eyebrow>FAQ</Eyebrow>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
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
            q="Can I really fix issues without being an expert?"
            a="Yes. Every violation gets a plain-English explanation and a concrete code snippet. Copy, paste, re-scan."
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
      <section className="container-page py-24">
        <div className="relative mx-auto flex max-w-3xl flex-col items-center overflow-hidden rounded-2xl border border-border bg-bg-elevated/60 p-10 text-center sm:p-14">
          <div
            aria-hidden="true"
            className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/60 to-transparent"
          />
          <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Scan your site now.{" "}
            <span className="gradient-text">See what&apos;s at risk in under a minute.</span>
          </h2>
          <p className="mt-4 max-w-xl text-base text-text-muted">
            No credit card. No signup for your first scan. Just paste a URL.
          </p>
          <div className="mt-8 flex w-full justify-center">
            <URLScanner />
          </div>
          <div className="mt-6 text-xs text-text-subtle">
            <Link href="/pricing" className="hover:text-text transition-colors">
              See plans →
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
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
        Built against the standards that matter
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
        {items.map((i) => (
          <span
            key={i}
            className="font-mono text-xs text-text-muted/80 transition-colors hover:text-text"
          >
            {i}
          </span>
        ))}
      </div>
    </div>
  );
}

function StatCell({ value, label }: { value: string; label: string }) {
  return (
    <div className="relative px-6 py-6 text-center sm:px-8 sm:py-7">
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
    <div className="card mx-auto max-w-4xl overflow-hidden p-0 shadow-glow-lg">
      <div className="flex items-center justify-between border-b border-border bg-bg-muted/60 px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-severity-critical/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-severity-moderate/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-accent/80" />
          <span className="ml-3 font-mono text-xs text-text-subtle">
            a11ymind.ai/scan/preview
          </span>
        </div>
        <span className="text-[10px] uppercase tracking-[0.18em] text-text-subtle">
          Preview
        </span>
      </div>

      <div className="grid gap-6 p-6 md:grid-cols-[minmax(0,220px)_minmax(0,1fr)]">
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-bg-muted/60 p-5">
          <ScoreDial score={62} />
          <p className="mt-3 text-xs uppercase tracking-wider text-text-subtle">
            Compliance
          </p>
          <p className="text-sm font-semibold text-severity-moderate">Needs work</p>
        </div>

        <div className="space-y-4">
          <div>
            <p className="mb-2 text-xs uppercase tracking-wider text-text-subtle">
              Risks detected
            </p>
            <div className="space-y-2">
              <RiskRow impact="critical" label="Images missing alt text" count={4} />
              <RiskRow impact="serious" label="Insufficient color contrast" count={7} />
              <RiskRow impact="moderate" label="Form inputs without labels" count={2} />
            </div>
          </div>

          <div className="rounded-xl border border-border bg-bg-muted/60 p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-wider text-accent">
                Recommended fix
              </p>
              <span className="inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-accent">
                <LockIcon /> Claude AI
              </span>
            </div>
            <p className="mt-3 text-sm text-text">
              <span className="font-semibold">Images missing alt text</span> — screen
              readers skip these, blocking visually impaired users from understanding key
              content.
            </p>
            <p className="mt-2 text-sm text-text-muted">
              Add a descriptive <code className="font-mono text-accent">alt</code>{" "}
              attribute that explains what the image conveys. Decorative images should use{" "}
              <code className="font-mono text-accent">alt=&quot;&quot;</code>.
            </p>
            <pre className="mt-3 overflow-x-auto rounded-md border border-border bg-bg p-3 font-mono text-xs text-text">
{`<img src="/hero.png" alt="Team celebrating product launch" />`}
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
    <div className="relative h-28 w-28">
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
        <span className="text-2xl font-semibold tabular-nums">{score}</span>
        <span className="text-[9px] uppercase tracking-wider text-text-subtle">
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
    <div className="flex items-center justify-between rounded-md border border-border bg-bg-muted/50 px-3 py-2 transition-colors hover:border-border-strong">
      <div className="flex items-center gap-3">
        <span className={`h-2 w-2 rounded-full ${color}`} />
        <span className="text-sm text-text">{label}</span>
      </div>
      <div className="flex items-center gap-3 text-xs text-text-subtle">
        <span>{labelText}</span>
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
            { href: "/login", label: "Sign in" },
            { href: "/signup", label: "Create account" },
            { href: "/dashboard", label: "Dashboard" },
          ]}
        />
        <FooterCol
          title="Resources"
          links={[
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
