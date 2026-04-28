"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function IssueAssigneeForm({
  violationId,
  initialName,
  initialEmail,
}: {
  violationId: string;
  initialName: string | null;
  initialEmail: string | null;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName ?? "");
  const [email, setEmail] = useState(initialEmail ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function saveAssignee(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) return;

    setIsSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/violation/${violationId}/assignee`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          assigneeName: name,
          assigneeEmail: email,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not update assignee.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update assignee.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={saveAssignee} className="rounded-xl border border-white/10 bg-bg/45 p-3">
      <p className="text-[10px] uppercase tracking-[0.18em] text-text-subtle">
        Assignee
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={120}
          placeholder="Name"
          className="rounded-md border border-border bg-bg-elevated px-3 py-2 text-xs text-text outline-none transition-colors placeholder:text-text-subtle focus:border-accent focus:ring-2 focus:ring-accent/30"
        />
        <input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          maxLength={254}
          placeholder="email@example.com"
          className="rounded-md border border-border bg-bg-elevated px-3 py-2 text-xs text-text outline-none transition-colors placeholder:text-text-subtle focus:border-accent focus:ring-2 focus:ring-accent/30"
        />
      </div>
      <div className="mt-3 flex justify-end">
        <button
          type="submit"
          disabled={isSaving}
          className="btn-ghost text-xs disabled:pointer-events-none disabled:opacity-50"
        >
          {isSaving ? "Saving..." : "Save assignee"}
        </button>
      </div>
      {error ? <p className="mt-2 text-xs text-severity-critical">{error}</p> : null}
    </form>
  );
}
