"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { buildScanResultHref } from "@/lib/scan-result-url";

export function URLScanner({
  ctaLabel = "Scan page",
  helperText = "No signup required for your first scan. We respect robots.txt and never modify your site.",
}: {
  ctaLabel?: string;
  helperText?: string;
}) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim() || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Scan failed");
      router.push(buildScanResultHref(data.scanId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="w-full max-w-xl">
      <div className="group relative flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-subtle"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M10 4.5a5.5 5.5 0 1 0 3.43 9.8l4.14 4.13 1.41-1.41-4.13-4.14A5.5 5.5 0 0 0 10 4.5Zm-3.5 5.5a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0Z"
                fill="currentColor"
              />
            </svg>
          </span>
          <input
            type="text"
            inputMode="url"
            autoComplete="url"
            spellCheck={false}
            maxLength={2048}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://yourwebsite.com"
            className="input pl-10"
            disabled={loading}
            aria-label="Website URL"
          />
        </div>
        <button type="submit" className="btn-primary whitespace-nowrap" disabled={loading || !url.trim()}>
          {loading ? (
            <>
              <Spinner />
              <span className="ml-2">Scanning…</span>
            </>
          ) : (
            <>
              <span>{ctaLabel}</span>
              <span aria-hidden="true" className="ml-1.5 transition-transform group-hover:translate-x-0.5">
                →
              </span>
            </>
          )}
        </button>
      </div>
      {loading && (
        <p className="mt-3 flex items-center gap-2 text-sm text-text-muted">
          <span className="inline-flex h-1.5 w-1.5 animate-pulse-soft rounded-full bg-accent" />
          Creating your scan job — the report page will show progress while Chromium runs 90+ WCAG checks.
        </p>
      )}
      {error && (
        <p className="mt-3 text-sm text-severity-critical" role="alert">
          {error}
        </p>
      )}
      <p className="mt-3 text-xs text-text-subtle">
        {helperText}
      </p>
    </form>
  );
}

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
