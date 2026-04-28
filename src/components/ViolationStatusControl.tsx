"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ViolationStatus } from "@prisma/client";
import {
  VIOLATION_STATUS_DESCRIPTIONS,
  VIOLATION_STATUS_LABELS,
  VIOLATION_STATUS_OPTIONS,
} from "@/lib/violation-status";

export function ViolationStatusControl({
  violationId,
  initialStatus,
}: {
  violationId: string;
  initialStatus: ViolationStatus;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<ViolationStatus>(initialStatus);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function updateStatus(nextStatus: ViolationStatus) {
    if (nextStatus === status || isSaving) return;

    const previousStatus = status;
    setStatus(nextStatus);
    setError(null);
    setIsSaving(true);

    try {
      const res = await fetch(`/api/violation/${violationId}/status`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.status) {
        throw new Error(data.error || "Could not update status.");
      }
      setStatus(data.status as ViolationStatus);
      router.refresh();
    } catch (err) {
      setStatus(previousStatus);
      setError(err instanceof Error ? err.message : "Could not update status.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="rounded-xl border border-white/10 bg-bg/55 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-text-subtle">
            Workflow status
          </p>
          <p className="mt-1 text-sm font-medium text-text">
            {VIOLATION_STATUS_LABELS[status]}
          </p>
          <p className="mt-0.5 text-xs text-text-muted">
          {VIOLATION_STATUS_DESCRIPTIONS[status]}
          </p>
        </div>
        <select
          value={status}
          disabled={isSaving}
          onChange={(event) => updateStatus(event.target.value as ViolationStatus)}
          className="rounded-md border border-border bg-bg-elevated px-3 py-2 text-xs text-text transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:opacity-60"
          aria-label="Update issue workflow status"
        >
          {VIOLATION_STATUS_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {VIOLATION_STATUS_LABELS[option]}
            </option>
          ))}
        </select>
      </div>
      {error ? <p className="mt-2 text-xs text-severity-critical">{error}</p> : null}
    </div>
  );
}
