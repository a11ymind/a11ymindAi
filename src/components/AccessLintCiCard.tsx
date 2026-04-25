export function AccessLintCiCard({ compact = false }: { compact?: boolean }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-text-subtle">
        CI integration — Pro
      </p>
      <p className="mt-1 text-sm text-text">
        Stream scan results from your CI/CD pipeline directly into your dashboard history.
      </p>
      {!compact && (
        <p className="mt-1 text-xs text-text-muted">
          Pro gives you an ingest token and API endpoint so every build posts accessibility
          results to your monitored page history — visible as CI checks alongside your
          scheduled scans.
        </p>
      )}
      <a
        href="/pricing"
        className="mt-3 inline-flex text-xs text-accent hover:underline"
      >
        Upgrade to Pro to unlock CI integration →
      </a>
    </div>
  );
}
