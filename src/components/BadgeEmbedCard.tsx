"use client";

import Image from "next/image";
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
          <div className="mt-3 rounded-xl border border-white/10 bg-background px-3 py-3">
            <Image
              src={badgeUrl}
              alt={`Accessibility monitored by a11ymind for ${siteUrl}`}
              width={244}
              height={36}
              className="h-9 w-auto"
              unoptimized
              loading="lazy"
            />
          </div>
        </div>

        <div className="w-full max-w-xl">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-medium text-text-muted">Embed snippet</p>
            <button type="button" onClick={onCopy} className="btn-ghost text-sm">
              {copied ? "Copied" : "Copy snippet"}
            </button>
          </div>
          {!compact && (
            <pre className="mt-2 overflow-x-auto rounded-xl border border-white/10 bg-background p-3 text-xs leading-5 text-text-subtle">
              <code>{snippet}</code>
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
