"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { buildScanResultHref } from "@/lib/scan-result-url";

type LimitState = { plan: string; maxSites: number; message: string };

export function URLScanner() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [limit, setLimit] = useState<LimitState | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim() || loading) return;
    setLoading(true);
    setError(null);
    setLimit(null);
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (res.status === 402 && data.error === "SITE_LIMIT") {
        setLimit({ plan: data.plan, maxSites: data.maxSites, message: data.message });
        setLoading(false);
        return;
      }
      if (!res.ok) throw new Error(data.error || "Scan failed");
      router.push(
        buildScanResultHref(data.scanId, {
          aiEnabled: data.aiEnabled,
          requiresLoginForAI: data.requiresLoginForAI,
          requiresUpgradeForAI: data.requiresUpgradeForAI,
          aiLimitReached: data.aiLimitReached,
        }),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="w-full max-w-xl">
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          inputMode="url"
          autoComplete="url"
          spellCheck={false}
          maxLength={2048}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://yourwebsite.com"
          className="input flex-1"
          disabled={loading}
          aria-label="Website URL"
        />
        <button type="submit" className="btn-primary" disabled={loading || !url.trim()}>
          {loading ? (
            <>
              <Spinner />
              <span className="ml-2">Scanning…</span>
            </>
          ) : (
            "Scan for free"
          )}
        </button>
      </div>
      {loading && (
        <p className="mt-3 text-sm text-text-muted">
          Loading the page in a headless browser and running 90+ WCAG checks. This usually takes 15–45 seconds.
        </p>
      )}
      {limit && (
        <div
          className="mt-3 rounded-md border border-accent-muted bg-accent-muted/10 p-3 text-sm"
          role="alert"
        >
          <p className="text-text">{limit.message}</p>
          <Link href="/pricing" className="mt-2 inline-block text-sm font-medium text-accent hover:underline">
            View plans →
          </Link>
        </div>
      )}
      {error && !limit && (
        <p className="mt-3 text-sm text-severity-critical" role="alert">
          {error}
        </p>
      )}
      <p className="mt-3 text-xs text-text-subtle">
        No signup required for your first scan. We respect robots.txt and never modify your site.
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
