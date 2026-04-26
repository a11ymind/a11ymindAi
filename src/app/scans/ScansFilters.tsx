"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

const SELECT_CLASS =
  "rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 transition-colors hover:border-white/20 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent";

interface Props {
  status: string;
  score: string;
  sort: string;
}

export function ScansFilters({ status, score, sort }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const update = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === "all" || value === "newest") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      params.delete("page");
      router.push(`/scans?${params.toString()}`);
    },
    [router, searchParams],
  );

  return (
    <div className="flex flex-wrap items-center gap-3" role="search" aria-label="Filter scans">
      <label className="flex items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-wider text-white/40">Status</span>
        <select
          className={SELECT_CLASS}
          value={status}
          onChange={(e) => update("status", e.target.value)}
          aria-label="Filter by status"
        >
          <option value="all">All statuses</option>
          <option value="COMPLETED">Completed</option>
          <option value="FAILED">Failed</option>
          <option value="PENDING">Pending</option>
          <option value="RUNNING">Running</option>
        </select>
      </label>

      <label className="flex items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-wider text-white/40">Score</span>
        <select
          className={SELECT_CLASS}
          value={score}
          onChange={(e) => update("score", e.target.value)}
          aria-label="Filter by score range"
        >
          <option value="all">All scores</option>
          <option value="good">Good (75–100)</option>
          <option value="warn">Warning (50–74)</option>
          <option value="bad">Critical (0–49)</option>
        </select>
      </label>

      <label className="flex items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-wider text-white/40">Sort</span>
        <select
          className={SELECT_CLASS}
          value={sort}
          onChange={(e) => update("sort", e.target.value)}
          aria-label="Sort scans"
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="score_desc">Score (high → low)</option>
          <option value="score_asc">Score (low → high)</option>
        </select>
      </label>
    </div>
  );
}
