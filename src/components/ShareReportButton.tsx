"use client";

import { useState } from "react";

export function ShareReportButton({
  scanId,
  baseUrl,
  initialToken,
}: {
  scanId: string;
  baseUrl: string;
  initialToken: string | null;
}) {
  const [token, setToken] = useState<string | null>(initialToken);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shareUrl = token ? `${baseUrl.replace(/\/$/, "")}/r/${token}` : null;

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/scan/${scanId}/share`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate link");
      setToken(data.token);
      if (navigator.clipboard && data.token) {
        try {
          await navigator.clipboard.writeText(
            `${baseUrl.replace(/\/$/, "")}/r/${data.token}`,
          );
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          // Clipboard blocked — user can still copy from the revealed field.
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate link");
    } finally {
      setLoading(false);
    }
  }

  async function revoke() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/scan/${scanId}/share`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to revoke");
      setToken(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to revoke link");
    } finally {
      setLoading(false);
    }
  }

  async function copyExisting() {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Couldn't copy automatically — select the URL manually.");
    }
  }

  if (!token) {
    return (
      <button
        type="button"
        onClick={generate}
        disabled={loading}
        className="btn-ghost text-sm"
      >
        {loading ? "Creating link…" : "Share report"}
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        readOnly
        value={shareUrl ?? ""}
        onFocus={(e) => e.currentTarget.select()}
        className="input max-w-xs font-mono text-xs"
        aria-label="Public share link"
      />
      <button
        type="button"
        onClick={copyExisting}
        className="btn-ghost text-sm"
      >
        {copied ? "Copied" : "Copy"}
      </button>
      <button
        type="button"
        onClick={revoke}
        disabled={loading}
        className="text-xs text-text-subtle hover:text-text"
      >
        Revoke
      </button>
      {error && <span className="text-xs text-severity-critical">{error}</span>}
    </div>
  );
}
