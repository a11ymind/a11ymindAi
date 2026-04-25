"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RetryScanButton({ scanId }: { scanId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    if (loading) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/scan/${scanId}/retry`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Retry failed");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Retry failed");
      setLoading(false);
    }
  }

  return (
    <div className="mt-6 flex flex-col items-center gap-2">
      <button type="button" className="btn-primary" onClick={onClick} disabled={loading}>
        {loading ? "Retrying..." : "Retry scan"}
      </button>
      {error && (
        <p className="text-sm text-severity-critical" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
