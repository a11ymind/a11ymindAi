"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { buildScanResultHref } from "@/lib/scan-result-url";

export function RescanButton({ url, compact = false }: { url: string; compact?: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    if (loading) return;
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
      router.push(
        buildScanResultHref(data.scanId, {
          aiEnabled: data.aiEnabled,
          requiresLoginForAI: data.requiresLoginForAI,
          requiresUpgradeForAI: data.requiresUpgradeForAI,
          aiLimitReached: data.aiLimitReached,
        }),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Scan failed");
      setLoading(false);
    }
  }

  return (
    <div className="inline-flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={onClick}
        disabled={loading}
        className={compact ? "btn-ghost text-xs" : "btn-ghost"}
      >
        {loading ? "Scanning…" : "Re-scan"}
      </button>
      {error && <span className="text-xs text-severity-critical">{error}</span>}
    </div>
  );
}
