"use client";

import { useState } from "react";

export function BadgeEmbedCard({
  siteUrl,
  badgeUrl,
  snippet,
  compact = false,
}: {
  siteUrl: string;
  badgeUrl: string;
  snippet: string;
  compact?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className={`${compact ? "" : "mt-4"} rounded-2xl border border-white/10 bg-white/5 p-4`}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-text-subtle">
            Monitoring badge
          </p>
          {!compact && (
            <>
              <p className="mt-1 text-sm text-text">
                Add a lightweight footer badge to show this website project is actively monitored by a11ymind.
              </p>
              <p className="mt-1 text-xs text-text-muted">
                This signals ongoing accessibility monitoring. It does not claim certification or full compliance.
              </p>
            </>
          )}
          <div className="mt-3 rounded-xl border border-white/10 bg-bg px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            {imageFailed ? (
              <div className="flex min-h-9 flex-wrap items-center justify-between gap-2 text-xs text-text-muted">
                <span>Badge preview could not load in the dashboard.</span>
                <a
                  href={badgeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline"
                >
                  Open SVG
                </a>
              </div>
            ) : (
              // The badge is an SVG route owned by this app. A plain image is
              // more reliable here than next/image because users often point
              // NEXT_PUBLIC_APP_URL at custom domains, previews, or localhost.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={badgeUrl}
                alt={`Accessibility monitored by a11ymind for ${siteUrl}`}
                width={244}
                height={36}
                className="h-9 w-auto max-w-full"
                loading="lazy"
                onError={() => setImageFailed(true)}
              />
            )}
          </div>
        </div>

        <div className="w-full max-w-xl">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-medium text-text-muted">Embed snippet</p>
            <button type="button" onClick={onCopy} className="btn-ghost text-sm">
              {copied ? "Copied" : "Copy snippet"}
            </button>
          </div>
          <pre
            className={`mt-2 overflow-x-auto rounded-xl border border-white/10 bg-bg text-xs leading-5 text-text-subtle ${
              compact ? "max-h-28 p-2" : "p-3"
            }`}
          >
            <code>{snippet}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}
