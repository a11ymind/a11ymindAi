"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ViolationStatus } from "@prisma/client";
import {
  VIOLATION_STATUS_LABELS,
  VIOLATION_STATUS_OPTIONS,
} from "@/lib/violation-status";

type BulkIssue = {
  id: string;
  help: string;
  impact: string;
  status: ViolationStatus;
  selector: string;
};

export function ViolationBulkStatusPanel({
  scanId,
  issues,
}: {
  scanId: string;
  issues: BulkIssue[];
}) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [nextStatus, setNextStatus] = useState<ViolationStatus>("IN_PROGRESS");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const allSelected = issues.length > 0 && selectedIds.length === issues.length;

  function toggleAll() {
    setSelectedIds(allSelected ? [] : issues.map((issue) => issue.id));
  }

  function toggleOne(id: string) {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  async function applyBulkStatus() {
    if (selectedIds.length === 0 || isSaving) return;

    setIsSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/scan/${scanId}/violations/status`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          violationIds: selectedIds,
          status: nextStatus,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Could not update selected issues.");
      }
      setSelectedIds([]);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update selected issues.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="premium-panel overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 px-6 py-5">
        <div>
          <p className="section-kicker">Bulk workflow</p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-text">
            Move selected issues through the fix process
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-text-muted">
            Select issues from the current filtered report, then mark them open, in progress, fixed, verified, or ignored.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={nextStatus}
            onChange={(event) => setNextStatus(event.target.value as ViolationStatus)}
            className="rounded-md border border-border bg-bg-elevated px-3 py-2 text-xs text-text transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:opacity-60"
            aria-label="Bulk issue status"
          >
            {VIOLATION_STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {VIOLATION_STATUS_LABELS[option]}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={selectedIds.length === 0 || isSaving}
            onClick={applyBulkStatus}
            className="btn-primary text-sm disabled:pointer-events-none disabled:opacity-50"
          >
            {isSaving ? "Updating..." : `Update ${selectedIds.length || ""}`.trim()}
          </button>
        </div>
      </div>
      <div className="divide-y divide-white/10">
        <label className="flex cursor-pointer items-center gap-3 px-6 py-3 text-xs text-text-subtle">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={toggleAll}
            className="h-4 w-4 rounded border-border bg-bg-elevated accent-cyan-400"
          />
          Select all visible issues
        </label>
        {issues.slice(0, 25).map((issue) => (
          <label
            key={issue.id}
            className="grid cursor-pointer gap-3 px-6 py-4 sm:grid-cols-[auto_1fr_auto] sm:items-center"
          >
            <input
              type="checkbox"
              checked={selectedSet.has(issue.id)}
              onChange={() => toggleOne(issue.id)}
              className="h-4 w-4 rounded border-border bg-bg-elevated accent-cyan-400"
            />
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-text">
                {issue.help}
              </span>
              <span className="mt-1 block truncate text-xs text-text-muted">
                {issue.selector || "Selector unavailable"}
              </span>
            </span>
            <span className="flex flex-wrap gap-2">
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-text-subtle">
                {issue.impact || "minor"}
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-text-subtle">
                {VIOLATION_STATUS_LABELS[issue.status]}
              </span>
            </span>
          </label>
        ))}
      </div>
      {issues.length > 25 ? (
        <p className="border-t border-white/10 px-6 py-3 text-xs text-text-subtle">
          Showing the first 25 visible issues for bulk editing.
        </p>
      ) : null}
      {error ? <p className="border-t border-white/10 px-6 py-3 text-xs text-severity-critical">{error}</p> : null}
    </div>
  );
}
