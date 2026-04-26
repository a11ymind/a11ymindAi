import type { Metadata } from "next";
import Link from "next/link";
import { Fraunces } from "next/font/google";
import { getSession } from "@/lib/auth";
import { URLScanner } from "@/components/URLScanner";

const fraunces = Fraunces({
  subsets: ["latin"],
  axes: ["opsz", "SOFT", "WONK"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "a11ymind AI – Accessibility monitoring, CI checks, and AI fixes",
  description:
    "Scan live pages, catch regressions, get AI-powered fix guidance, and share reports teams can act on before accessibility work turns into last-minute cleanup.",
  openGraph: {
    title: "a11ymind AI – Accessibility monitoring, CI checks, and AI fixes",
    description:
      "Scan live pages, catch regressions, get AI-powered fix guidance, and share reports teams can act on.",
    url: "/",
  },
  twitter: {
    title: "a11ymind AI – Accessibility monitoring, CI checks, and AI fixes",
    description:
      "Scan live pages, catch regressions, get AI-powered fix guidance, and share reports teams can act on.",
  },
};

// ── Editorial design tokens (paper/ink, light mode) ──────────────────────────
const T = {
  paper:  "#f3efe6",
  paper2: "#ece7da",
  ink:    "#0f0d0a",
  ink2:   "#2a2722",
  ink3:   "#5a544a",
  ink4:   "#8a8276",
  rule:   "#1a1814",
  hair:   "rgba(15,13,10,0.16)",
  link:   "#0e6d80",
  crit:   "#b3261e",
  ser:    "#b56216",
  mod:    "#957017",
  min:    "#1f4f8a",
} as const;

export default async function LandingPage() {
  const session = await getSession();
  const isAuthed = Boolean(session?.user?.id);

  return (
    <div
      className={fraunces.variable}
      style={{ background: T.paper, color: T.ink, fontFamily: "var(--font-mono, 'Geist Mono', monospace)", fontSize: 14, lineHeight: 1.55 }}
    >
      {/* Paper grain texture */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
          backgroundImage: [
            "radial-gradient(circle at 25% 20%, rgba(15,13,10,0.025) 0, transparent 1px)",
            "radial-gradient(circle at 75% 60%, rgba(15,13,10,0.02) 0, transparent 1px)",
            "radial-gradient(circle at 40% 80%, rgba(15,13,10,0.025) 0, transparent 1px)",
          ].join(", "),
          backgroundSize: "7px 7px, 11px 11px, 13px 13px",
          mixBlendMode: "multiply",
        }}
      />

      {/* ── MASTHEAD ──────────────────────────────────────────────────── */}
      <header
        style={{
          borderBottom: `2px solid ${T.rule}`,
          padding: "12px 0 0",
          position: "sticky", top: 0,
          background: T.paper,
          zIndex: 50,
        }}
      >
        <a
          href="#main"
          className="sr-only focus:not-sr-only"
          style={{ position: "absolute", left: 16, top: 16, zIndex: 100, background: T.ink, color: T.paper, padding: "6px 14px", fontSize: 12, textDecoration: "none" }}
        >
          Skip to main content
        </a>

        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", fontFamily: "var(--font-mono)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.12em", color: T.ink3 }}>
            <span>Accessibility intelligence</span>
            <span style={{ fontStyle: "italic", fontFamily: "var(--font-serif)" }}>a11ymind AI</span>
            <span>Est. 2024</span>
          </div>

          <p style={{ textAlign: "center", fontFamily: "var(--font-serif)", fontWeight: 500, fontStyle: "italic", fontSize: 38, lineHeight: 1, margin: "6px 0 4px", letterSpacing: "-0.02em", fontVariationSettings: '"opsz" 144', color: T.ink }}>
            <strong style={{ fontStyle: "normal", fontWeight: 700 }}>a11ymind</strong>
            {" "}<span style={{ fontSize: "0.55em", verticalAlign: "0.4em", letterSpacing: "0.1em", fontStyle: "normal", fontWeight: 600 }}>AI</span>
          </p>

          <p style={{ textAlign: "center", fontFamily: "var(--font-mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.32em", color: T.ink3, paddingBottom: 8 }}>
            — accessibility, audited like it matters —
          </p>

          <nav
            aria-label="Primary"
            style={{ borderTop: `1px solid ${T.rule}`, paddingTop: 10, paddingBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}
          >
            <div style={{ display: "flex", gap: 28, fontFamily: "var(--font-mono)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.16em" }}>
              <Link href="#the-case" style={{ textDecoration: "none", color: T.ink2 }}>The case</Link>
              <Link href="#how-it-reads" style={{ textDecoration: "none", color: T.ink2 }}>How it reads</Link>
              <Link href="/pricing" style={{ textDecoration: "none", color: T.ink2 }}>Pricing &amp; plans</Link>
            </div>
            <div style={{ display: "flex", gap: 12, fontFamily: "var(--font-mono)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.16em", alignItems: "center" }}>
              {isAuthed ? (
                <Link href="/dashboard" style={{ textDecoration: "none", color: T.ink2 }}>Dashboard</Link>
              ) : (
                <Link href="/login" style={{ textDecoration: "none", color: T.ink2 }}>Sign in</Link>
              )}
              <Link
                href="#scanner"
                style={{ textDecoration: "none", color: T.paper, background: T.ink, padding: "7px 14px", display: "inline-block" }}
              >
                Run a scan
              </Link>
            </div>
          </nav>
        </div>
      </header>

      <main id="main" style={{ position: "relative", zIndex: 1 }}>

        {/* ── HERO ────────────────────────────────────────────────────── */}
        <section aria-labelledby="hero-heading" style={{ padding: "56px 0 32px", borderBottom: `1px solid ${T.rule}` }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "100px 1fr 220px", gap: 32, alignItems: "flex-start" }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.16em", color: T.ink3, borderTop: `1px solid ${T.rule}`, paddingTop: 6 }}>
                Filed under
                <em style={{ display: "block", fontStyle: "normal", color: T.ink, marginTop: 4, fontSize: 11 }}>Lawsuits, Web</em>
                <em style={{ display: "block", marginTop: 8, color: T.ink3, fontStyle: "normal" }}>
                  Plaintiffs filed{" "}
                  <strong style={{ color: T.ink }}>3,255</strong> ADA web accessibility lawsuits in 2024.
                </em>
              </div>

              <div>
                <h1
                  id="hero-heading"
                  style={{ fontFamily: "var(--font-serif)", fontWeight: 400, fontStyle: "italic", fontSize: "clamp(56px, 8.4vw, 116px)", lineHeight: 0.95, letterSpacing: "-0.035em", margin: 0, color: T.ink, fontVariationSettings: '"opsz" 144, "SOFT" 0', textWrap: "balance" } as React.CSSProperties}
                >
                  We exist{" "}
                  <strong style={{ fontWeight: 600, fontStyle: "normal" }}>because</strong>{" "}
                  of <strong>this.</strong>
                </h1>
                <p style={{ fontFamily: "var(--font-serif)", fontWeight: 400, fontSize: 18, lineHeight: 1.5, color: T.ink2, margin: "22px 0 0", maxWidth: 320, borderLeft: `2px solid ${T.rule}`, padding: "4px 0 4px 16px" }}>
                  A scanner, a fix engine, and a watchman — for teams who would rather find
                  their accessibility issues on a Tuesday than in a complaint.
                </p>
              </div>

              <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.16em", color: T.ink3, borderTop: `1px solid ${T.rule}`, paddingTop: 6, textAlign: "right" }}>
                On the desk
                <em style={{ display: "block", fontStyle: "normal", color: T.ink, marginTop: 4, fontSize: 11 }}>The scanner, p. 03</em>
                <em style={{ display: "block", fontStyle: "normal", color: T.ink3, fontSize: 11 }}>The verdict, p. 05</em>
              </div>
            </div>

            <div style={{ marginTop: 56, display: "grid", gridTemplateColumns: "100px 1fr 220px", gap: 32, borderTop: `1px solid ${T.rule}`, paddingTop: 24 }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, lineHeight: 1.6, color: T.ink2 }}>
                <span style={{ display: "block", textTransform: "uppercase", letterSpacing: "0.16em", fontSize: 9, color: T.ink4, marginBottom: 6 }}>Source</span>
                UsableNet midyear report, 2024 — federal &amp; state filings.
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, lineHeight: 1.6, color: T.ink2, textAlign: "center" }}>
                <span style={{ display: "inline-block", textTransform: "uppercase", letterSpacing: "0.16em", fontSize: 9, color: T.ink4, marginBottom: 6 }}>— what we offer —</span>
                <strong style={{ display: "block", color: T.ink }}>Continuous scanning · AI fix guidance · CI enforcement · Plain-English reports.</strong>
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, lineHeight: 1.6, color: T.ink2, textAlign: "right" }}>
                <span style={{ display: "block", textTransform: "uppercase", letterSpacing: "0.16em", fontSize: 9, color: T.ink4, marginBottom: 6 }}>Disclaimer</span>
                Automated testing does not replace manual review for full conformance or legal sign-off.
              </div>
            </div>
          </div>
        </section>

        {/* ── MANIFESTO ───────────────────────────────────────────────── */}
        <section id="the-case" aria-labelledby="manifesto-heading" style={{ padding: "56px 0", borderBottom: `1px solid ${T.rule}` }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 64, alignItems: "flex-start" }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.18em", color: T.ink3, borderTop: `2px solid ${T.rule}`, paddingTop: 8, position: "sticky", top: 120 }}>
                <span id="manifesto-heading">No. 01</span>
                <em style={{ display: "block", fontStyle: "normal", color: T.ink, fontSize: 12, marginTop: 4 }}>The case</em>
              </div>
              <div style={{ fontFamily: "var(--font-serif)", fontSize: 17, lineHeight: 1.55, color: T.ink2, columns: 2, columnGap: 48 }}>
                <p style={{ margin: "0 0 14px", textIndent: 0 }}>
                  <span aria-hidden="true" style={{ fontFamily: "var(--font-serif)", fontWeight: 600, fontSize: "5.6em", lineHeight: 0.85, float: "left", padding: "6px 10px 0 0", color: T.ink, fontVariationSettings: '"opsz" 144' }}>M</span>
                  ost accessibility tools were built to produce a document — a long PDF a consultant emails to a director of engineering, who forwards it to a project manager, who files it under <em style={{ fontStyle: "italic" }}>Q4 — later</em>. The document was the product. The fix was someone else&apos;s problem.
                </p>
                <p style={{ margin: "0 0 14px", textIndent: "1.2em" }}>
                  We think the document is <strong style={{ fontWeight: 600, color: T.ink }}>where the work begins, not where it ends.</strong> So we built a system that does what every product team already does for performance, for security, for analytics: <em style={{ fontStyle: "italic" }}>monitor it, alert on regressions, and propose a fix in the same breath as the finding.</em>
                </p>
                <p style={{ margin: "0 0 14px", textIndent: "1.2em" }}>
                  The result is calmer than it sounds. Most weeks, your dashboard says nothing. When it does say something, it says it in code — a diff you can copy into your editor, or a comment posted on the pull request that introduced the regression.
                </p>
                <p style={{ margin: "0 0 14px", textIndent: "1.2em" }}>
                  This is what we mean by <strong style={{ fontWeight: 600, color: T.ink }}>operating accessibility</strong>: not a campaign, not a quarter-long initiative, not a flag on a roadmap. A small, persistent piece of plumbing — the kind of thing that becomes invisible the moment it works.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── DOCUMENT AS HERO ────────────────────────────────────────── */}
        <section aria-labelledby="report-heading" style={{ padding: "56px 0 64px", borderBottom: `1px solid ${T.rule}` }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 64, alignItems: "flex-end", borderBottom: `1px solid ${T.rule}`, paddingBottom: 18, marginBottom: 32 }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.18em", color: T.ink3, borderTop: `2px solid ${T.rule}`, paddingTop: 8 }}>
                No. 02<em style={{ display: "block", fontStyle: "normal", color: T.ink, fontSize: 12, marginTop: 4 }}>What you get</em>
              </div>
              <h2 id="report-heading" style={{ fontFamily: "var(--font-serif)", fontWeight: 500, fontSize: 44, lineHeight: 1, letterSpacing: "-0.025em", margin: 0, fontVariationSettings: '"opsz" 144' }}>
                A scan, <em style={{ fontStyle: "italic", fontWeight: 400, color: T.ink3 }}>annotated.</em>
              </h2>
            </div>

            {/* Report card */}
            <div style={{ background: "#fbf8f1", border: `1px solid ${T.rule}`, boxShadow: `6px 6px 0 ${T.rule}`, overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto auto", gap: 24, padding: "14px 24px", borderBottom: `1px solid ${T.rule}`, background: T.paper, fontFamily: "var(--font-mono)", fontSize: 11, color: T.ink3 }}>
                <span style={{ color: T.ink, fontWeight: 500 }}>checkout.example.com/cart</span>
                <Pill>chromium 121 · 1280×800</Pill>
                <Pill>14s · 4 m ago</Pill>
                <Pill>scan #00482</Pill>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "320px 1fr" }}>
                <div style={{ padding: 28, borderRight: `1px solid ${T.rule}`, background: `linear-gradient(180deg, #fbf8f1, ${T.paper2})` }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.18em", color: T.ink3 }}>Score</div>
                  <div style={{ fontFamily: "var(--font-serif)", fontWeight: 500, fontSize: 130, lineHeight: 0.9, letterSpacing: "-0.04em", margin: "4px 0 0", fontVariationSettings: '"opsz" 144' }}>
                    72<sup style={{ fontSize: 24, verticalAlign: "super", color: T.ink3, fontWeight: 400 }}>/100</sup>
                  </div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: T.ser, marginTop: 6 }}>+5 since last scan · target ≥ 90</div>
                  <p style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontWeight: 400, fontSize: 18, lineHeight: 1.45, color: T.ink2, margin: "14px 0 0", paddingTop: 14, borderTop: `1px solid ${T.hair}` }}>
                    <strong style={{ fontStyle: "normal", fontWeight: 600, color: T.ink }}>Verdict.</strong>{" "}
                    Two critical findings. Both have a one-line fix attached. The page would pass an automated audit for the first time in three weeks if these ship today.
                  </p>
                </div>
                <div>
                  <FindingRow num="i." title="Images missing alt text" desc="Screen readers will announce filenames or skip these images entirely. Cart thumbnails, four elements." sev="Critical" count={4} sevColor={T.crit} />
                  <FindingRow num="ii." title="Buttons referencing non-existent ARIA IDs" desc="The drawer was renamed three weeks ago; one trigger still points to the old id. One element." sev="Critical" count={1} sevColor={T.crit} />
                  <FindingRow num="iii." title="Insufficient color contrast" desc="Subtle text on dark canvas at ratio 3.6:1 — below WCAG AA threshold of 4.5:1. Seven elements." sev="Serious" count={7} sevColor={T.ser} />
                  <FindingRow num="iv." title="Form inputs without labels" desc="The promo code field is placeholder-as-label; it disappears on focus. Two elements." sev="Serious" count={2} sevColor={T.ser} />
                  <FindingRow num="v." title="Skip-link not visible on focus" desc="A skip-to-content link exists but is hidden in all states; keyboard users can't see when it has focus." sev="Moderate" count={1} sevColor={T.mod} last />
                </div>
              </div>
            </div>

            <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "220px 1fr 220px", gap: 64, fontFamily: "var(--font-mono)", fontSize: 11, lineHeight: 1.6, color: T.ink3 }}>
              <div>The score is computed against the WCAG 2.2 AA ruleset, weighted by element count and severity.</div>
              <div />
              <div style={{ textAlign: "right" }}>Each finding links to the AI-generated diff and the rule it derives from. Apply the diff, push, and the next scan re-runs in under a minute.</div>
            </div>
          </div>
        </section>

        {/* ── COMPARE ─────────────────────────────────────────────────── */}
        <section aria-labelledby="compare-heading" style={{ padding: "56px 0", borderBottom: `1px solid ${T.rule}` }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 64, alignItems: "flex-start" }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.18em", color: T.ink3, borderTop: `2px solid ${T.rule}`, paddingTop: 8 }}>
                No. 03<em id="compare-heading" style={{ display: "block", fontStyle: "normal", color: T.ink, fontSize: 12, marginTop: 4 }}>Comparison</em>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", border: `1px solid ${T.rule}` }}>
                <div style={{ padding: 28, borderRight: `1px solid ${T.rule}` }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.18em", color: T.ink3 }}>Legacy scanners</span>
                  <h3 style={{ fontFamily: "var(--font-serif)", fontWeight: 500, fontSize: 26, lineHeight: 1.15, margin: "8px 0 16px", letterSpacing: "-0.015em" }}>
                    Output a violation list, <em style={{ fontStyle: "italic", color: T.ink3 }}>then go quiet.</em>
                  </h3>
                  <CompareList items={[
                    "One-off audit. No history, no monitoring, no signal when the page drifts.",
                    "Generic WCAG quotations attached to the violation. No fix.",
                    "Every issue surfaced equally. Reading the report is its own project.",
                    "No CI signal. A regression slips into main and lives there.",
                  ]} />
                </div>
                <div style={{ padding: 28, background: "#fbf8f1" }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.18em", color: T.link }}>a11ymind AI</span>
                  <h3 style={{ fontFamily: "var(--font-serif)", fontWeight: 500, fontSize: 26, lineHeight: 1.15, margin: "8px 0 16px", letterSpacing: "-0.015em" }}>
                    Operates the system <em style={{ fontStyle: "italic", color: T.ink3 }}>end-to-end.</em>
                  </h3>
                  <CompareList items={[
                    "Continuous monitoring across every project, every page, every day.",
                    "AI fix guidance — a diff for the file and line that produced the finding.",
                    "Severity-weighted, blocker-aware. The dashboard tells you what to do first.",
                    "AccessLint blocks regressions in CI before the PR merges.",
                  ]} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── PULL QUOTE ──────────────────────────────────────────────── */}
        <section aria-label="Customer quote" style={{ padding: "56px 0", borderBottom: `1px solid ${T.rule}` }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 64, alignItems: "flex-start" }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.18em", color: T.ink3, borderTop: `2px solid ${T.rule}`, paddingTop: 8 }}>
                No. 04<em style={{ display: "block", fontStyle: "normal", color: T.ink, fontSize: 12, marginTop: 4 }}>From a customer</em>
              </div>
              <blockquote style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontWeight: 400, fontSize: "clamp(28px, 3.6vw, 46px)", lineHeight: 1.18, letterSpacing: "-0.015em", margin: 0, color: T.ink, fontVariationSettings: '"opsz" 144' } as React.CSSProperties}>
                &ldquo;The first month, it caught three contrast regressions in our checkout that QA missed.
                By month two, our PR template just included the AccessLint badge. We stopped talking
                about accessibility and started shipping it.&rdquo;
              </blockquote>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 64, marginTop: 18 }}>
              <div />
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.16em", color: T.ink3 }}>
                <strong style={{ color: T.ink, fontWeight: 500 }}>Asha Patel</strong> · Director of Engineering, Loomwright · interviewed Aug 2025
              </div>
            </div>
          </div>
        </section>

        {/* ── HOW IT READS ────────────────────────────────────────────── */}
        <section id="how-it-reads" aria-labelledby="steps-heading" style={{ padding: "56px 0", borderBottom: `1px solid ${T.rule}` }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 64, alignItems: "flex-start" }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.18em", color: T.ink3, borderTop: `2px solid ${T.rule}`, paddingTop: 8 }}>
                No. 05<em id="steps-heading" style={{ display: "block", fontStyle: "normal", color: T.ink, fontSize: 12, marginTop: 4 }}>How it reads</em>
              </div>
              <div>
                {STEPS.map((s) => (
                  <div key={s.step} style={{ display: "grid", gridTemplateColumns: "80px 1fr 200px 80px", gap: 24, padding: "22px 0", borderBottom: `1px solid ${T.rule}`, alignItems: "baseline" }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: T.ink3 }}>Step {s.step}</span>
                    <div>
                      <h3 style={{ fontFamily: "var(--font-serif)", fontWeight: 500, fontSize: 22, lineHeight: 1.2, margin: 0, letterSpacing: "-0.012em" }}>{s.title}</h3>
                      <em style={{ display: "block", fontStyle: "italic", color: T.ink3, fontSize: 14, fontFamily: "var(--font-serif)", fontWeight: 400, marginTop: 4, lineHeight: 1.45 }}>{s.desc}</em>
                    </div>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: T.ink3 }}>{s.by}</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: T.ink, textAlign: "right" }}>→ {s.price}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── SCANNER CTA ─────────────────────────────────────────────── */}
        <section id="scanner" aria-labelledby="scanner-heading" style={{ padding: "56px 0", borderBottom: `1px solid ${T.rule}`, background: T.ink, color: T.paper }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 64, alignItems: "flex-start" }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.18em", color: T.paper2, borderTop: `1px solid ${T.paper}`, paddingTop: 8 }}>
                No. 06<em style={{ display: "block", fontStyle: "normal", color: T.paper, fontSize: 12, marginTop: 4 }}>The scanner</em>
              </div>
              <div>
                <h2 id="scanner-heading" style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontWeight: 400, fontSize: "clamp(36px, 5vw, 56px)", lineHeight: 1, letterSpacing: "-0.025em", margin: "0 0 24px", maxWidth: 720 }}>
                  Three steps. <strong style={{ fontStyle: "normal", fontWeight: 600 }}>No setup.</strong>
                </h2>
                <div style={{ maxWidth: 640 }}>
                  <URLScanner ctaLabel="Run scan" helperText="No signup required for your first scan. We respect robots.txt and never modify your site." />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── COLOPHON / FOOTER ───────────────────────────────────────── */}
        <footer aria-label="Site colophon" style={{ padding: "48px 0 32px", background: T.paper }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 64, alignItems: "flex-start" }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.18em", color: T.ink3, borderTop: `2px solid ${T.rule}`, paddingTop: 8 }}>
                Colophon<em style={{ display: "block", fontStyle: "normal", color: T.ink, fontSize: 12, marginTop: 4 }}>About this paper</em>
              </div>
              <div style={{ fontFamily: "var(--font-serif)", fontSize: 14, lineHeight: 1.55, color: T.ink2, columns: 2, columnGap: 48 }}>
                <p style={{ margin: "0 0 12px" }}>
                  <strong style={{ fontWeight: 600, color: T.ink }}>a11ymind, Inc.</strong> is a small company building accessibility infrastructure for product teams. We answer email.
                </p>
                <p style={{ margin: "0 0 12px" }}>
                  This page is set in <strong style={{ fontWeight: 600, color: T.ink }}>Fraunces</strong> for headlines, and <strong style={{ fontWeight: 600, color: T.ink }}>Geist Mono</strong> by Vercel for body and marginalia. The app dashboard uses <strong style={{ fontWeight: 600, color: T.ink }}>Geist</strong>.
                </p>
                <p style={{ margin: "0 0 12px" }}>
                  The single chromatic accent — used only for links — is <em style={{ fontStyle: "italic" }}>oxide cyan</em>. Severity colors exist for one reason only: to mark accessibility risk.
                </p>
              </div>
            </div>

            <div style={{ marginTop: 24, paddingTop: 20, borderTop: `1px solid ${T.rule}`, display: "grid", gridTemplateColumns: "220px 1fr", gap: 64, fontFamily: "var(--font-mono)", fontSize: 11, color: T.ink3 }}>
              <span>© {new Date().getFullYear()} a11ymind, Inc.</span>
              <nav aria-label="Footer links" style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                {FOOTER_LINKS.map((l) => (
                  <Link key={l.href} href={l.href} style={{ color: T.ink2, textDecoration: "none" }}>
                    {l.label}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}

// ── Static data ───────────────────────────────────────────────────────────────

const STEPS = [
  { step: "01", title: "Scan a URL.", desc: "Headless Chromium runs the WCAG 2.2 ruleset against the rendered DOM. No code, no install, no surprise crawl charges.", by: "~ 14 seconds", price: "free" },
  { step: "02", title: "Read the verdict.", desc: "Findings ranked by severity and element count. Each row is a sentence; each row links to the rule and the fix.", by: "No login required", price: "free" },
  { step: "03", title: "Apply the diff.", desc: "Open any finding for an AI-generated fix snippet — JSX, ARIA, CSS contrast. Paste, push, rescan.", by: "Pro plan", price: "$49/mo" },
  { step: "04", title: "Wire it into the build.", desc: "The AccessLint GitHub Action runs on every PR. Severity-weighted blocker logic you control. The dashboard goes quiet when CI is green.", by: "Pro plan", price: "$49/mo" },
  { step: "05", title: "Hand a report to counsel.", desc: "Plain-English PDF, signed timestamps, audit trail per page. The thing your lawyer asked for in the email you didn't open.", by: "All paid plans", price: "included" },
] as const;

const FOOTER_LINKS = [
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
  { label: "Support", href: "mailto:support@a11ymind.ai" },
  { label: "Pricing", href: "/pricing" },
  { label: "Dashboard", href: "/dashboard" },
] as const;

// ── Sub-components ────────────────────────────────────────────────────────────

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "1px 8px", border: "1px solid #1a1814", borderRadius: 999 }}>
      {children}
    </span>
  );
}

function FindingRow({ num, title, desc, sev, count, sevColor, last = false }: {
  num: string;
  title: string;
  desc: string;
  sev: string;
  count: number;
  sevColor: string;
  last?: boolean;
}) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "56px 1fr 80px", gap: 16, padding: "14px 28px", borderBottom: last ? "none" : "1px solid rgba(15,13,10,0.16)", alignItems: "baseline" }}>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#8a8276" }}>{num}</span>
      <div>
        <span style={{ fontFamily: "var(--font-serif)", fontWeight: 500, fontSize: 18, lineHeight: 1.3, color: "#0f0d0a", display: "block" }}>{title}</span>
        <em style={{ fontStyle: "italic", fontWeight: 400, color: "#5a544a", display: "block", fontSize: 13, marginTop: 3, lineHeight: 1.45 }}>{desc}</em>
      </div>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.14em", textAlign: "right", color: sevColor }}>
        {sev}
        <span style={{ display: "block", fontFamily: "var(--font-serif)", fontSize: 26, lineHeight: 1, color: "#0f0d0a", marginTop: 4, fontWeight: 500, letterSpacing: "-0.02em" }}>{count}</span>
      </div>
    </div>
  );
}

function CompareList({ items }: { items: readonly string[] }) {
  return (
    <ul style={{ listStyle: "none", padding: 0, margin: 0, fontFamily: "var(--font-serif)", fontSize: 16, lineHeight: 1.5 }}>
      {items.map((item, i) => (
        <li key={i} style={{ padding: "10px 0", borderBottom: i < items.length - 1 ? "1px solid rgba(15,13,10,0.16)" : "none", display: "grid", gridTemplateColumns: "24px 1fr", gap: 10 }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#8a8276" }}>{["i", "ii", "iii", "iv"][i]}</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
