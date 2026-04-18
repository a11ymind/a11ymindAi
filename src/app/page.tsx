import Link from "next/link";
import { Logo } from "@/components/Logo";
import { URLScanner } from "@/components/URLScanner";
import { getSession } from "@/lib/auth";

export default async function LandingPage() {
  const session = await getSession();
  return (
    <main className="min-h-screen">
      <header className="container-page flex items-center justify-between py-6">
        <Logo />
        <nav className="flex items-center gap-6 text-sm text-text-muted">
          <Link href="#how-it-works" className="hover:text-text transition-colors">
            How it works
          </Link>
          <Link href="/pricing" className="hover:text-text transition-colors">
            Pricing
          </Link>
          {session?.user ? (
            <Link href="/dashboard" className="hover:text-text transition-colors">
              Dashboard
            </Link>
          ) : (
            <Link href="/login" className="hover:text-text transition-colors">
              Sign in
            </Link>
          )}
        </nav>
      </header>

      {/* Hero */}
      <section className="container-page flex flex-col items-center py-20 text-center sm:py-28">
        <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-bg-elevated px-3 py-1 text-xs text-text-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          ADA / WCAG 2.1 AA coverage
        </span>
        <h1 className="max-w-3xl text-balance text-4xl font-semibold leading-[1.1] tracking-tight sm:text-6xl">
          Fix accessibility issues
          <br />
          <span className="bg-gradient-to-r from-accent to-cyan-300 bg-clip-text text-transparent">
            before they become legal problems.
          </span>
        </h1>
        <p className="mt-6 max-w-xl text-base text-text-muted sm:text-lg">
          Scan your website in seconds and get clear, actionable fixes — no technical
          knowledge needed.
        </p>

        <div className="mt-10 flex w-full justify-center">
          <URLScanner />
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-text-subtle">
          <span>No credit card required</span>
          <span className="hidden sm:inline">•</span>
          <span>Results in seconds</span>
          <span className="hidden sm:inline">•</span>
          <span>Plain-English fixes</span>
        </div>
      </section>

      {/* Problem / differentiation */}
      <section className="container-page py-16">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs uppercase tracking-wider text-accent">Why a11ymind</p>
          <h2 className="mt-2 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Most tools tell you what&apos;s wrong. a11ymind helps you fix it.
          </h2>
          <p className="mt-4 text-base text-text-muted">
            Traditional accessibility scanners spit out a wall of technical violations and leave
            you to figure out the rest. We translate them into plain English and show you exactly
            how to fix each one.
          </p>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-2">
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
            label="a11ymind"
            points={[
              "Plain-English explanations of every risk",
              "Copy-pasteable code fixes, per violation",
              "Built for founders, designers, and developers",
              "Ongoing monitoring, not a one-shot audit",
            ]}
          />
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="container-page py-16">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs uppercase tracking-wider text-accent">How it works</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            Three steps. No setup.
          </h2>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <FeatureCard
            step="01"
            title="Scan your website"
            body="Paste any public URL. We load it in a real headless browser — no plugins, no installs."
          />
          <FeatureCard
            step="02"
            title="See accessibility risks"
            body="Get a compliance score and a ranked list of risks by severity, so you know what to tackle first."
          />
          <FeatureCard
            step="03"
            title="Get recommended fixes"
            body="Each risk comes with a plain-English explanation and a concrete code snippet you can paste."
          />
        </div>
      </section>

      {/* Demo / value preview */}
      <section className="container-page py-16">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs uppercase tracking-wider text-accent">What you get</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            A report you&apos;ll actually use.
          </h2>
          <p className="mt-4 text-base text-text-muted">
            Not a 40-page PDF of line items. A focused view of what&apos;s risky, why it matters, and
            how to fix it.
          </p>
        </div>
        <div className="mt-12">
          <ResultPreview />
        </div>
      </section>

      {/* Monitoring / ongoing value */}
      <section className="container-page py-16">
        <div className="card mx-auto max-w-5xl p-8 sm:p-12">
          <div className="grid gap-8 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] md:items-center">
            <div>
              <p className="text-xs uppercase tracking-wider text-accent">
                Ongoing protection
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
                Accessibility isn&apos;t a one-time fix.
              </h2>
              <p className="mt-4 text-base text-text-muted">
                Websites change. A new template, a redesigned hero, an added form — any of them can
                introduce new accessibility risks overnight. a11ymind re-scans your saved sites on a
                schedule and flags regressions before users (or lawyers) do.
              </p>
              <ul className="mt-5 space-y-2 text-sm text-text">
                <li className="flex items-start gap-2">
                  <Dot /> Automatic weekly or monthly re-scans
                </li>
                <li className="flex items-start gap-2">
                  <Dot /> Track your compliance score over time
                </li>
                <li className="flex items-start gap-2">
                  <Dot /> Get notified when something regresses
                </li>
              </ul>
            </div>
            <div className="rounded-lg border border-border bg-bg-elevated p-5">
              <p className="text-xs uppercase tracking-wider text-text-subtle">
                Score history
              </p>
              <SparkTrend />
              <p className="mt-3 text-xs text-text-subtle">
                Catch regressions the moment they ship.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="container-page py-20">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Scan your site now. See what&apos;s at risk in under a minute.
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

      <footer className="container-page flex flex-col items-center justify-between gap-4 border-t border-border py-8 text-xs text-text-subtle sm:flex-row">
        <Logo />
        <p>© {new Date().getFullYear()} a11ymind. Built for small teams that can&apos;t afford a six-figure audit.</p>
      </footer>
    </main>
  );
}

function FeatureCard({ step, title, body }: { step: string; title: string; body: string }) {
  return (
    <div className="card p-6">
      <div className="mb-3 font-mono text-xs text-accent">{step}</div>
      <h3 className="mb-2 text-lg font-semibold">{title}</h3>
      <p className="text-sm text-text-muted">{body}</p>
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
      className={`card p-6 ${
        isAccent ? "border-accent-muted shadow-glow" : "border-border"
      }`}
    >
      <p
        className={`text-xs uppercase tracking-wider ${
          isAccent ? "text-accent" : "text-text-subtle"
        }`}
      >
        {label}
      </p>
      <ul className="mt-4 space-y-3 text-sm">
        {points.map((p) => (
          <li key={p} className="flex items-start gap-3">
            {isAccent ? (
              <CheckIcon />
            ) : (
              <DashIcon />
            )}
            <span className={isAccent ? "text-text" : "text-text-muted"}>{p}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ResultPreview() {
  return (
    <div className="card mx-auto max-w-4xl overflow-hidden p-0">
      <div className="flex items-center justify-between border-b border-border bg-bg-elevated px-5 py-3">
        <div className="flex items-center gap-2 text-xs text-text-subtle">
          <span className="h-2 w-2 rounded-full bg-severity-critical/80" />
          <span className="h-2 w-2 rounded-full bg-severity-moderate/80" />
          <span className="h-2 w-2 rounded-full bg-accent/80" />
          <span className="ml-3 font-mono">a11ymind.ai/scan/preview</span>
        </div>
        <span className="text-[10px] uppercase tracking-wider text-text-subtle">Preview</span>
      </div>

      <div className="grid gap-6 p-6 md:grid-cols-[minmax(0,220px)_minmax(0,1fr)]">
        {/* Score dial */}
        <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-bg-muted/60 p-5">
          <ScoreDial score={62} />
          <p className="mt-3 text-xs uppercase tracking-wider text-text-subtle">Compliance</p>
          <p className="text-sm font-semibold text-severity-moderate">Needs work</p>
        </div>

        {/* Risks + fix preview */}
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

          <div className="rounded-lg border border-border bg-bg-muted/60 p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-wider text-accent">
                Recommended fix
              </p>
              <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-wider text-text-subtle">
                <LockIcon /> Preview
              </span>
            </div>
            <p className="mt-3 text-sm text-text">
              <span className="font-semibold">Images missing alt text</span> — screen readers skip
              these, blocking visually impaired users from understanding key content.
            </p>
            <p className="mt-2 text-sm text-text-muted">
              Add a descriptive <code className="font-mono text-accent">alt</code> attribute that
              explains what the image conveys. Decorative images should use{" "}
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
        <circle cx="50" cy="50" r={radius} stroke="#262626" strokeWidth="7" fill="none" />
        <circle
          cx="50"
          cy="50"
          r={radius}
          stroke="#f59e0b"
          strokeWidth="7"
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circ}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-semibold tabular-nums">{score}</span>
        <span className="text-[9px] uppercase tracking-wider text-text-subtle">/ 100</span>
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
  const labelText = impact === "critical" ? "Critical" : impact === "serious" ? "Serious" : "Moderate";
  return (
    <div className="flex items-center justify-between rounded-md border border-border bg-bg-muted/50 px-3 py-2">
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
  // Illustrative-only SVG — no data, just shape.
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
          <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${d} L ${w} ${h} L 0 ${h} Z`} fill="url(#sparkFill)" />
      <path d={d} fill="none" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="m4 10 4 4 8-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DashIcon() {
  return (
    <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-text-subtle" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M5 10h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function Dot() {
  return <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent" />;
}

function LockIcon() {
  return (
    <svg className="h-3 w-3 text-accent" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect x="4" y="9" width="12" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M7 9V6a3 3 0 1 1 6 0v3" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
