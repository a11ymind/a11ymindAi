"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CrawlSiteButton({ siteId }: { siteId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    if (loading) return;
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch(`/api/site/${siteId}/crawl`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "Discovery failed");
      setMessage(
        `Discovered ${data.discovered} page${data.discovered === 1 ? "" : "s"} and started ${data.createdScans} scan${data.createdScans === 1 ? "" : "s"}.`,
      );
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Discovery failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="inline-flex flex-col items-end gap-1">
      <button type="button" className="btn-ghost text-sm" onClick={onClick} disabled={loading}>
        {loading ? "Discovering..." : "Discover pages"}
      </button>
      {message && <span className="max-w-xs text-right text-xs text-accent">{message}</span>}
      {error && <span className="max-w-xs text-right text-xs text-severity-critical">{error}</span>}
    </div>
  );
}
