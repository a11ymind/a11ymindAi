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

      <section className="container-page flex flex-col items-center py-20 text-center sm:py-28">
        <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-bg-elevated px-3 py-1 text-xs text-text-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          ADA / WCAG 2.1 AA coverage
        </span>
        <h1 className="max-w-3xl text-balance text-4xl font-semibold leading-[1.1] tracking-tight sm:text-6xl">
          Know your accessibility risk
          <br />
          <span className="bg-gradient-to-r from-accent to-cyan-300 bg-clip-text text-transparent">
            before a lawsuit does.
          </span>
        </h1>
        <p className="mt-6 max-w-xl text-base text-text-muted sm:text-lg">
          Accessly scans any URL and returns a compliance score, the specific elements putting you at risk,
          and AI-generated fixes written in plain English.
        </p>

        <div className="mt-10 flex w-full justify-center">
          <URLScanner />
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-text-subtle">
          <span>No credit card required</span>
          <span className="hidden sm:inline">•</span>
          <span>Results in seconds</span>
          <span className="hidden sm:inline">•</span>
          <span>Powered by axe-core + Claude</span>
        </div>
      </section>

      <section id="how-it-works" className="container-page grid gap-6 py-16 md:grid-cols-3">
        <FeatureCard
          step="01"
          title="Scan any public URL"
          body="We load your page in a real headless browser and run the industry-standard axe-core ruleset across WCAG 2.1 A and AA."
        />
        <FeatureCard
          step="02"
          title="Get a compliance score"
          body="A single 0–100 number weighted by severity. Understand at a glance whether you're in the clear or exposed."
        />
        <FeatureCard
          step="03"
          title="Fix it in plain English"
          body="Every violation comes with an AI-generated explanation, the legal context, and a concrete code snippet you can paste."
        />
      </section>

      <footer className="container-page flex flex-col items-center justify-between gap-4 border-t border-border py-8 text-xs text-text-subtle sm:flex-row">
        <Logo />
        <p>© {new Date().getFullYear()} Accessly. Built for small teams that can&apos;t afford a six-figure audit.</p>
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
