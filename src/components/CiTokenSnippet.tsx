"use client";

import { useState } from "react";
import { CopyButton } from "@/components/CopyButton";

export function CiTokenSnippet({
  siteId,
  endpoint,
  initialToken,
}: {
  siteId: string;
  endpoint: string;
  initialToken: string;
}) {
  const [token, setToken] = useState(initialToken);
  const [rotating, setRotating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rotatedAt, setRotatedAt] = useState<Date | null>(null);

  const snippet = buildCiSnippet({ endpoint, token });

  async function rotate() {
    const confirmed =
      typeof window === "undefined"
        ? true
        : window.confirm(
            "Rotate the CI ingest token? The current token will stop working immediately — update any CI jobs that use it.",
          );
    if (!confirmed) return;

    setRotating(true);
    setError(null);
    try {
      const res = await fetch(`/api/site/${siteId}/rotate-ci-token`, {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.token) {
        throw new Error(data.error || "Could not rotate token.");
      }
      setToken(data.token);
      setRotatedAt(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not rotate token.");
    } finally {
      setRotating(false);
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <CopyButton text={snippet} label="Copy CI snippet" className="btn-ghost text-sm" />
        <button
          type="button"
          className="btn-ghost text-sm"
          onClick={rotate}
          disabled={rotating}
        >
          {rotating ? "Rotating…" : "Rotate token"}
        </button>
      </div>
      <pre className="mt-4 overflow-x-auto rounded-xl border border-white/10 bg-background p-3 text-xs leading-5 text-text-subtle">
        <code>{snippet}</code>
      </pre>
      {rotatedAt && (
        <p className="mt-2 text-xs text-accent">
          New token active. Update any CI jobs that still use the old one.
        </p>
      )}
      {error && <p className="mt-2 text-xs text-severity-critical">{error}</p>}
    </>
  );
}

function buildCiSnippet({ endpoint, token }: { endpoint: string; token: string }) {
  return `curl -X POST "${endpoint}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "token": "${token}",
    "source": "accesslint",
    "status": "passed",
    "score": 88,
    "criticalCount": 0,
    "seriousCount": 2,
    "moderateCount": 4,
    "minorCount": 3,
    "branch": "main",
    "commitSha": "abc1234",
    "environment": "preview"
  }'`;
}
