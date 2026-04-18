import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { getSession } from "@/lib/auth";
import { PLAN_TIERS, type PlanTier } from "@/lib/plans";

export const metadata = { title: "Pricing — a11ymind AI" };
export const dynamic = "force-dynamic";

export default async function PricingPage({
  searchParams,
}: {
  searchParams?: { error?: string; canceled?: string };
}) {
  const session = await getSession();
  const currentPlan = session?.user?.plan ?? null;
  const banner = pricingBanner(searchParams?.error, searchParams?.canceled);

  return (
    <>
      <SiteHeader />
      <main id="main" className="min-h-screen">

      {banner && (
        <section className="container-page pt-4">
          <div className={`card flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between ${banner.tone === "error" ? "border-severity-critical/40 bg-severity-critical/10" : "border-accent-muted bg-accent-muted/10"}`}>
            <div>
              <p className="text-sm font-medium text-text">{banner.title}</p>
              <p className="text-xs text-text-muted">{banner.body}</p>
            </div>
            {banner.code ? (
              <p className="font-mono text-xs text-text-subtle">{banner.code}</p>
            ) : null}
          </div>
        </section>
      )}

      <section className="relative overflow-hidden">
        <div className="aurora" aria-hidden="true" />
        <div className="grid-bg" aria-hidden="true" />
        <div className="container-page relative flex flex-col items-center py-16 text-center sm:py-24">
          <span className="chip mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            Start free · upgrade when the workflow justifies it
          </span>
          <h1 className="max-w-3xl animate-fade-in-up text-balance text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl">
            Choose the workflow that matches{" "}
            <span className="gradient-text">how seriously you manage risk.</span>
          </h1>
          <p className="mt-5 max-w-xl text-base text-text-muted">
            Free is for fast visibility. Starter is for one site you care about. Pro is for
            teams and agencies that need monitoring, AI remediation, and reports worth
            sending onward.
          </p>
        </div>
      </section>

      <section className="container-page pb-10">
        <div className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border/60 md:grid-cols-3">
          <PlanModeCard
            title="Free"
            eyebrow="See the risk"
            body="Run scans on any page and get a credible first pass before you commit budget."
          />
          <PlanModeCard
            title="Starter"
            eyebrow="Fix and monitor"
            body="Turn one important website into an ongoing workflow with AI fixes and scheduled rescans."
          />
          <PlanModeCard
            title="Pro"
            eyebrow="Operate at scale"
            body="Monitor multiple sites, generate reports, and give clients or stakeholders proof you are staying on top of changes."
            highlight
          />
        </div>
      </section>

      <section className="container-page grid items-stretch gap-6 pb-12 md:grid-cols-3">
        {PLAN_TIERS.map((tier) => (
          <PricingCard
            key={tier.id}
            tier={tier}
            currentPlan={currentPlan}
            signedIn={!!session?.user}
          />
        ))}
      </section>

      {/* Why subscribe / monitoring justification */}
      <section className="container-page pb-16">
        <div className="card mx-auto max-w-4xl p-8 sm:p-10">
          <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] md:items-start">
            <div>
              <p className="text-xs uppercase tracking-wider text-accent">
                Why a subscription
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                Accessibility isn&apos;t a one-time job.
              </h2>
            </div>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start gap-3">
                <BulletDot />
                <span>
                  <span className="text-text">Sites change constantly.</span>{" "}
                  <span className="text-text-muted">
                    New components, redesigns, and content updates can introduce fresh accessibility
                    risks overnight.
                  </span>
                </span>
              </li>
              <li className="flex items-start gap-3">
                <BulletDot />
                <span>
                  <span className="text-text">Repeat scans catch regressions.</span>{" "}
                  <span className="text-text-muted">
                    a11ymind re-scans your saved sites automatically and flags new risks as soon as
                    they appear.
                  </span>
                </span>
              </li>
              <li className="flex items-start gap-3">
                <BulletDot />
                <span>
                  <span className="text-text">You stay protected, not just informed.</span>{" "}
                  <span className="text-text-muted">
                    One-shot audits go stale. Ongoing monitoring keeps your compliance score
                    trending in the right direction.
                  </span>
                </span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="container-page pb-24">
        <div className="card p-6 text-sm text-text-muted">
          <p className="font-medium text-text">All plans include</p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            <li>• axe-core WCAG 2.1 A + AA rule coverage</li>
            <li>• Severity-weighted 0–100 compliance score</li>
            <li>• Per-violation legal rationale referencing WCAG success criteria</li>
            <li>• Change-over-time score history</li>
          </ul>
          <p className="mt-5 text-xs text-text-subtle">
            AI fix suggestions are generated on demand by Claude. We respect robots.txt and never
            modify your site. a11ymind helps you reduce accessibility risk — it does not constitute
            legal advice or a guarantee of WCAG/ADA compliance.
          </p>
        </div>
      </section>
      </main>
    </>
  );
}

type PlanCopy = {
  pitch: string;
  bestFor: string;
  primaryCta: string;
};

const PLAN_COPY: Record<string, PlanCopy> = {
  FREE: {
    pitch: "Run scans on any public page and keep one important site on your radar.",
    bestFor: "Best for operators who need visibility before they need a workflow.",
    primaryCta: "Run a free scan",
  },
  STARTER: {
    pitch: "Turn one live website into a recurring accessibility workflow with AI help.",
    bestFor: "Best for small sites, solo operators, and focused teams.",
    primaryCta: "Fix my site",
  },
  PRO: {
    pitch: "Manage accessibility across multiple sites with reporting that is ready to share.",
    bestFor: "Best for agencies, product teams, and serious site owners.",
    primaryCta: "Get full protection",
  },
};

const PLAN_OUTCOMES: Record<
  string,
  { outcome: string; rhythm: string; proof: string }
> = {
  FREE: {
    outcome: "Know what is risky before you ship blind.",
    rhythm: "Manual scans whenever you need a gut-check.",
    proof: "Good for early discovery and quick validation.",
  },
  STARTER: {
    outcome: "Keep one site under active accessibility watch.",
    rhythm: "Monthly monitoring plus AI fixes when issues matter.",
    proof: "Best first paid step when one website drives revenue or reputation.",
  },
  PRO: {
    outcome: "Run accessibility like an operating discipline, not a one-off task.",
    rhythm: "Weekly monitoring, AI remediation, and shareable reporting.",
    proof: "Best for agencies, multi-site teams, and customer-facing operations.",
  },
};

function planCopy(id: string): PlanCopy {
  return PLAN_COPY[id] ?? { pitch: "", bestFor: "", primaryCta: "Run a free scan" };
}

function PricingCard({
  tier,
  currentPlan,
  signedIn,
}: {
  tier: PlanTier;
  currentPlan: string | null;
  signedIn: boolean;
}) {
  const isCurrent = currentPlan === tier.id;
  const copy = planCopy(tier.id);
  const outcome = PLAN_OUTCOMES[tier.id] ?? {
    outcome: "",
    rhythm: "",
    proof: "",
  };
  const highlightCls = tier.highlight
    ? "border-accent shadow-glow md:-translate-y-2"
    : "border-border";

  return (
    <div className={`card relative flex flex-col p-6 transition-transform ${highlightCls}`}>
      {tier.highlight && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full border border-accent bg-accent px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-bg">
          Most popular
        </span>
      )}
      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-semibold">{tier.name}</h2>
      </div>
      <p className="mt-1 text-sm text-text-muted">{copy.pitch}</p>

      <div className="mt-5 flex items-baseline gap-1">
        <span className="text-4xl font-semibold tracking-tight">
          ${tier.priceUsd}
        </span>
        <span className="text-sm text-text-muted">
          {tier.priceUsd === 0 ? "forever" : "/month"}
        </span>
      </div>

      <p className="mt-2 text-xs text-text-subtle">{copy.bestFor}</p>

      <div className="mt-6 rounded-xl border border-border bg-bg-muted/40 p-4">
        <p className="text-[10px] uppercase tracking-[0.18em] text-accent">Outcome</p>
        <p className="mt-2 text-sm font-medium text-text">{outcome.outcome}</p>
        <p className="mt-3 text-sm text-text-muted">{outcome.rhythm}</p>
        <p className="mt-2 text-xs leading-relaxed text-text-subtle">{outcome.proof}</p>
      </div>

      <div className="mt-6">
        <PricingCTA
          tier={tier}
          isCurrent={isCurrent}
          signedIn={signedIn}
          currentPlan={currentPlan}
          primaryCta={copy.primaryCta}
        />
      </div>

      <div className="mt-6 border-t border-border/70 pt-5">
        <p className="text-[10px] uppercase tracking-[0.18em] text-text-subtle">
          What you actually unlock
        </p>
      </div>
      <ul className="mt-6 space-y-2.5 text-sm">
        {tier.features.map((f) => (
          <li
            key={f.text}
            className={`flex items-start gap-2 ${f.included ? "text-text" : "text-text-subtle line-through"}`}
          >
            <CheckOrDash included={f.included} />
            <span>{f.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PricingCTA({
  tier,
  isCurrent,
  signedIn,
  currentPlan,
  primaryCta,
}: {
  tier: PlanTier;
  isCurrent: boolean;
  signedIn: boolean;
  currentPlan: string | null;
  primaryCta: string;
}) {
  if (isCurrent) {
    return (
      <button className="btn-ghost w-full" disabled>
        Current plan
      </button>
    );
  }
  if (tier.id === "FREE") {
    return (
      <Link href={signedIn ? "/dashboard" : "/signup"} className="btn-ghost w-full">
        {signedIn ? "Open dashboard" : primaryCta}
      </Link>
    );
  }
  const useBillingPortal =
    signedIn && currentPlan !== null && currentPlan !== "FREE" && tier.id !== currentPlan;
  if (useBillingPortal) {
    return (
      <Link
        href="/api/stripe/portal?returnTo=%2Fpricing"
        className={tier.highlight ? "btn-primary w-full" : "btn-ghost w-full"}
      >
        Manage in billing portal
      </Link>
    );
  }
  const href = `/api/stripe/checkout?plan=${tier.id}`;
  return (
    <Link
      href={href}
      className={tier.highlight ? "btn-primary w-full" : "btn-ghost w-full"}
    >
      {primaryCta}
    </Link>
  );
}

function BulletDot() {
  return <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent" />;
}

function CheckOrDash({ included }: { included: boolean }) {
  if (included) {
    return (
      <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="m4 10 4 4 8-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-text-subtle" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M5 10h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function PlanModeCard({
  title,
  eyebrow,
  body,
  highlight = false,
}: {
  title: string;
  eyebrow: string;
  body: string;
  highlight?: boolean;
}) {
  return (
    <div className={`bg-bg-elevated/60 px-5 py-6 ${highlight ? "relative" : ""}`}>
      <p className={`text-[10px] uppercase tracking-[0.18em] ${highlight ? "text-accent" : "text-text-subtle"}`}>
        {eyebrow}
      </p>
      <h2 className="mt-2 text-xl font-semibold tracking-tight text-text">{title}</h2>
      <p className="mt-3 text-sm leading-relaxed text-text-muted">{body}</p>
    </div>
  );
}

function pricingBanner(error: string | undefined, canceled: string | undefined) {
  if (canceled === "1") {
    return {
      tone: "info" as const,
      title: "Checkout was canceled.",
      body: "Your plan did not change. You can restart checkout whenever you're ready.",
      code: null,
    };
  }

  switch (error) {
    case "price_not_configured":
      return {
        tone: "info" as const,
        title: "Paid checkout is not configured in this environment.",
        body: "Set real Stripe price IDs for Starter and Pro to enable subscription checkout.",
        code: "error=price_not_configured",
      };
    case "checkout_failed":
      return {
        tone: "error" as const,
        title: "We couldn't start Stripe Checkout.",
        body: "Try again in a moment. If this keeps happening, verify your Stripe keys and price IDs.",
        code: "error=checkout_failed",
      };
    case "checkout_no_url":
      return {
        tone: "error" as const,
        title: "Stripe Checkout did not return a redirect URL.",
        body: "Try again in a moment. If it happens again, verify the Stripe product and price configuration for this plan.",
        code: "error=checkout_no_url",
      };
    case "unknown_plan":
      return {
        tone: "error" as const,
        title: "That plan could not be found.",
        body: "Refresh the page and try again from the pricing cards.",
        code: "error=unknown_plan",
      };
    case "already_on_plan":
      return {
        tone: "info" as const,
        title: "You're already on that plan.",
        body: "Use the billing portal if you need to update payment details or manage your subscription.",
        code: "error=already_on_plan",
      };
    case "billing_portal_required":
      return {
        tone: "info" as const,
        title: "Existing subscriptions are managed in the billing portal.",
        body: "Use the portal to upgrade, downgrade, cancel, or update your payment method without creating a duplicate subscription.",
        code: "error=billing_portal_required",
      };
    case "no_subscription":
      return {
        tone: "info" as const,
        title: "No active Stripe subscription was found for this account.",
        body: "Start a paid plan from here first, then use the billing portal for future changes.",
        code: "error=no_subscription",
      };
    case "portal_failed":
      return {
        tone: "error" as const,
        title: "We couldn't open the billing portal.",
        body: "Try again in a moment. If it still fails, verify your Stripe customer record and portal setup.",
        code: "error=portal_failed",
      };
    default:
      return null;
  }
}
