"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type ScanStatus = "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";

export function ScanProgressClient({ scanId }: { scanId: string }) {
  const router = useRouter();
  const fallbackStartedRef = useRef(false);
  const [status, setStatus] = useState<ScanStatus>("PENDING");
  const [error, setError] = useState<string | null>(null);
  const [attemptCount, setAttemptCount] = useState(0);
  const [startedAt, setStartedAt] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let pollTimer: ReturnType<typeof setTimeout> | null = null;
    let fallbackTimer: ReturnType<typeof setTimeout> | null = null;

    async function poll() {
      try {
        const res = await fetch(`/api/scan/${scanId}/status`, {
          cache: "no-store",
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Could not read scan status");
        if (cancelled) return;

        setStatus(data.status);
        setAttemptCount(data.attemptCount ?? 0);
        setStartedAt(data.startedAt ?? null);
        if (data.status === "COMPLETED" || data.status === "FAILED") {
          router.refresh();
          return;
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Could not read scan status");
        }
      }

      if (!cancelled) {
        pollTimer = setTimeout(poll, 2500);
      }
    }

    fallbackTimer = setTimeout(() => {
      if (cancelled || fallbackStartedRef.current) return;
      fallbackStartedRef.current = true;
      void fetch(`/api/scan/${scanId}/run`, {
        method: "POST",
        cache: "no-store",
      }).catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Could not start scan");
        }
      });
    }, 7000);

    pollTimer = setTimeout(poll, 1000);

    return () => {
      cancelled = true;
      if (pollTimer) clearTimeout(pollTimer);
      if (fallbackTimer) clearTimeout(fallbackTimer);
    };
  }, [router, scanId]);

  return (
    <div className="mt-6 rounded-xl border border-border bg-bg-muted/40 p-4 text-left">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-2.5 w-2.5 animate-pulse-soft rounded-full bg-accent" />
        <p className="text-sm font-medium text-text">
          {status === "PENDING" ? "Queued" : "Running browser scan"}
        </p>
      </div>
      <p className="mt-2 text-sm text-text-muted">
        Loading the page in headless Chromium, running WCAG checks, and saving exact failing selectors.
      </p>
      <div className="mt-3 flex flex-wrap gap-2 text-xs text-text-subtle">
        <span className="rounded-full border border-border px-2.5 py-1">
          Attempt {Math.max(attemptCount, status === "RUNNING" ? 1 : 0) || 1}
        </span>
        {startedAt && (
          <span className="rounded-full border border-border px-2.5 py-1">
            Started {new Date(startedAt).toLocaleTimeString()}
          </span>
        )}
      </div>
      {error && (
        <p className="mt-3 text-sm text-severity-critical" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
