"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function IssueCommentForm({ violationId }: { violationId: string }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submitComment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = body.trim();
    if (!trimmed || isSaving) return;

    setIsSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/violation/${violationId}/comments`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ body: trimmed }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not add comment.");
      setBody("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add comment.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={submitComment} className="mt-3 space-y-2">
      <textarea
        value={body}
        onChange={(event) => setBody(event.target.value)}
        rows={3}
        maxLength={2000}
        placeholder="Add implementation notes, PR links, or client context..."
        className="w-full rounded-xl border border-border bg-bg-elevated px-3 py-2 text-sm text-text outline-none transition-colors placeholder:text-text-subtle focus:border-accent focus:ring-2 focus:ring-accent/30"
      />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-text-subtle">{body.length}/2000</p>
        <button
          type="submit"
          disabled={!body.trim() || isSaving}
          className="btn-primary text-sm disabled:pointer-events-none disabled:opacity-50"
        >
          {isSaving ? "Adding..." : "Add comment"}
        </button>
      </div>
      {error ? <p className="text-xs text-severity-critical">{error}</p> : null}
    </form>
  );
}
