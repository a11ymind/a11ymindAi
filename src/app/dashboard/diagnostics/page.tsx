import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/Logo";
import { SignOutButton } from "@/components/UserMenu";
import { TestEmailButton } from "@/components/TestEmailButton";
import { getSession } from "@/lib/auth";
import { getDeploymentDiagnostics } from "@/lib/deployment-diagnostics";

export const dynamic = "force-dynamic";
export const metadata = { title: "Diagnostics — Accessly" };

export default async function DiagnosticsPage() {
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");

  const diagnostics = getDeploymentDiagnostics();

  return (
    <main className="min-h-screen">
      <header className="container-page flex flex-wrap items-center justify-between gap-4 py-6">
        <Link href="/">
          <Logo />
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-sm text-text-muted hover:text-text">
            Dashboard
          </Link>
          <SignOutButton />
        </div>
      </header>

      <section className="container-page mt-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Deployment diagnostics</h1>
            <p className="mt-1 text-sm text-text-muted">
              Internal launch checks for configuration and integration wiring. Secret values are never shown.
            </p>
          </div>
          <div className={`card px-4 py-3 ${diagnostics.summary.ready ? "border-accent-muted bg-accent-muted/10" : "border-severity-critical/40 bg-severity-critical/10"}`}>
            <p className="text-xs uppercase tracking-wider text-text-subtle">Status</p>
            <p className="mt-1 text-sm font-medium text-text">
              {diagnostics.summary.ready ? "Ready to verify" : "Configuration issues detected"}
            </p>
            <p className="mt-1 text-xs text-text-muted">
              {diagnostics.summary.failCount} fail · {diagnostics.summary.warnCount} warn
            </p>
          </div>
        </div>
      </section>

      <section className="container-page mt-8 grid gap-4 md:grid-cols-2">
        {diagnostics.checks.map((check) => (
          <CheckCard key={check.name} name={check.name} status={check.status} message={check.message} />
        ))}
      </section>

      <section className="container-page mt-10 grid gap-6 lg:grid-cols-2">
        <EnvSection title="Required environment" items={diagnostics.requiredEnv} />
        <EnvSection title="Optional environment" items={diagnostics.optionalEnv} />
      </section>

      <section className="container-page mt-10 grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-text-subtle">
            Integration status
          </h2>
          <div className="mt-4 space-y-3 text-sm">
            <IntegrationRow
              label="Stripe"
              status={diagnostics.integrations.stripe.configured ? "pass" : "fail"}
              detail={
                diagnostics.integrations.stripe.starterPricePlaceholder ||
                diagnostics.integrations.stripe.proPricePlaceholder
                  ? "Configured, but one or more price IDs still look like placeholders."
                  : diagnostics.integrations.stripe.configured
                    ? "Core Stripe secrets are present."
                    : "Missing Stripe secret or webhook secret."
              }
            />
            <IntegrationRow
              label="Anthropic"
              status={diagnostics.integrations.anthropic.configured ? "pass" : "warn"}
              detail={
                diagnostics.integrations.anthropic.configured
                  ? "AI remediation is available."
                  : "AI remediation is disabled."
              }
            />
            <IntegrationRow
              label="Resend"
              status={
                diagnostics.integrations.resend.partial
                  ? "fail"
                  : diagnostics.integrations.resend.configured
                    ? "pass"
                    : "warn"
              }
              detail={
                diagnostics.integrations.resend.configured
                  ? "Transactional email is ready to send."
                  : diagnostics.integrations.resend.partial
                    ? "Only one Resend variable is set. Add both API key and from address."
                    : "Transactional email is not configured yet."
              }
            />
            <IntegrationRow
              label="Google OAuth"
              status={
                diagnostics.integrations.googleOAuth.partial
                  ? "fail"
                  : diagnostics.integrations.googleOAuth.configured
                    ? "pass"
                    : "warn"
              }
              detail={
                diagnostics.integrations.googleOAuth.partial
                  ? "Only one Google OAuth variable is set."
                  : diagnostics.integrations.googleOAuth.configured
                    ? "Google OAuth is enabled."
                    : "Email/password auth only."
              }
            />
          </div>
          <div className="mt-5 rounded-lg border border-border bg-bg-muted/40 px-4 py-4">
            <p className="text-sm font-medium text-text">Email verification</p>
            <p className="mt-1 text-xs text-text-muted">
              Send a test email to your signed-in address to confirm Resend is wired correctly.
            </p>
            <TestEmailButton disabled={!diagnostics.integrations.resend.configured} />
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-text-subtle">
            App URL checks
          </h2>
          <div className="mt-4 space-y-3 text-sm">
            <IntegrationRow
              label="NEXTAUTH_URL"
              status={diagnostics.appUrls.nextAuthUrl.valid ? "pass" : "fail"}
              detail={formatUrlDetail(diagnostics.appUrls.nextAuthUrl)}
            />
            <IntegrationRow
              label="NEXT_PUBLIC_APP_URL"
              status={diagnostics.appUrls.publicAppUrl.valid ? "pass" : "fail"}
              detail={formatUrlDetail(diagnostics.appUrls.publicAppUrl)}
            />
            <IntegrationRow
              label="Origin match"
              status={diagnostics.appUrls.originsMatch ? "pass" : "fail"}
              detail={
                diagnostics.appUrls.originsMatch
                  ? "Public app URL and auth URL share the same origin."
                  : "Origins do not match."
              }
            />
            <IntegrationRow
              label="HTTPS"
              status={diagnostics.appUrls.httpsRecommended ? "pass" : "warn"}
              detail={
                diagnostics.appUrls.httpsRecommended
                  ? "Configured URLs use HTTPS."
                  : "At least one configured URL is non-HTTPS."
              }
            />
          </div>
        </div>
      </section>

      <section className="container-page mt-10 pb-24">
        <div className="card p-6 text-sm text-text-muted">
          <p className="font-medium text-text">Access model</p>
          <p className="mt-2">
            This page is protected by the existing `/dashboard/*` auth middleware and an explicit
            server-side session check. The current architecture does not have admin roles, so any
            authenticated user can access it. No raw secret values are rendered.
          </p>
        </div>
      </section>
    </main>
  );
}

function EnvSection({
  title,
  items,
}: {
  title: string;
  items: { name: string; status: "pass" | "warn" | "fail"; note: string }[];
}) {
  return (
    <div className="card p-6">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-text-subtle">{title}</h2>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div
            key={item.name}
            className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-border bg-bg-muted/40 px-4 py-3"
          >
            <div>
              <p className="font-mono text-xs text-text">{item.name}</p>
              <p className="mt-1 text-xs text-text-muted">{item.note}</p>
            </div>
            <StatusPill status={item.status} />
          </div>
        ))}
      </div>
    </div>
  );
}

function CheckCard({
  name,
  status,
  message,
}: {
  name: string;
  status: "pass" | "warn" | "fail";
  message: string;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-text">{name}</p>
          <p className="mt-1 text-sm text-text-muted">{message}</p>
        </div>
        <StatusPill status={status} />
      </div>
    </div>
  );
}

function IntegrationRow({
  label,
  status,
  detail,
}: {
  label: string;
  status: "pass" | "warn" | "fail";
  detail: string;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-border bg-bg-muted/40 px-4 py-3">
      <div>
        <p className="text-sm font-medium text-text">{label}</p>
        <p className="mt-1 text-xs text-text-muted">{detail}</p>
      </div>
      <StatusPill status={status} />
    </div>
  );
}

function StatusPill({ status }: { status: "pass" | "warn" | "fail" }) {
  const styles =
    status === "pass"
      ? "border-accent-muted bg-accent-muted/20 text-accent"
      : status === "warn"
        ? "border-severity-moderate/40 bg-severity-moderate/15 text-severity-moderate"
        : "border-severity-critical/40 bg-severity-critical/15 text-severity-critical";

  const label = status === "pass" ? "Pass" : status === "warn" ? "Warn" : "Fail";

  return (
    <span className={`rounded-full border px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider ${styles}`}>
      {label}
    </span>
  );
}

function formatUrlDetail(value: { present: boolean; valid: boolean; origin: string | null }) {
  if (!value.present) return "Missing";
  if (!value.valid) return "Present but not a valid absolute URL";
  return `Configured for ${value.origin}`;
}
