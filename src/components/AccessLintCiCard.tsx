import { CopyButton } from "@/components/CopyButton";

const SNIPPET = `- uses: a11ymind/accesslint@v1
  with:
    url: https://preview.example.com
    fail-on: serious`;

export function AccessLintCiCard() {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-text-subtle">
            Run in CI — free
          </p>
          <p className="mt-1 text-sm text-text">
            Catch regressions on every PR with the open-source AccessLint GitHub Action.
          </p>
          <p className="mt-1 text-xs text-text-muted">
            Fails the build at your chosen severity, uploads JSON + Markdown artifacts,
            and needs no token. Upgrade to Pro to also stream results into your dashboard history.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <CopyButton text={SNIPPET} label="Copy snippet" className="btn-ghost text-sm" />
          <a
            href="https://github.com/a11ymind/accesslint"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost text-sm"
          >
            View on GitHub →
          </a>
        </div>
      </div>
      <pre className="mt-4 overflow-x-auto rounded-xl border border-white/10 bg-background p-3 text-xs leading-5 text-text-subtle">
        <code>{SNIPPET}</code>
      </pre>
    </div>
  );
}
