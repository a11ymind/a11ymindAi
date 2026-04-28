"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function IssueAssigneeForm({
  violationId,
  initialUserId,
  initialName,
  initialEmail,
  members,
}: {
  violationId: string;
  initialUserId: string | null;
  initialName: string | null;
  initialEmail: string | null;
  members: {
    userId: string;
    label: string;
    email: string;
  }[];
}) {
  const router = useRouter();
  const [assigneeUserId, setAssigneeUserId] = useState(initialUserId ?? "");
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
          assigneeUserId: assigneeUserId || null,
          assigneeName: assigneeUserId ? "" : name,
          assigneeEmail: assigneeUserId ? "" : email,
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
      {members.length > 0 ? (
        <select
          value={assigneeUserId}
          onChange={(event) => setAssigneeUserId(event.target.value)}
          className="mt-3 w-full rounded-md border border-border bg-bg-elevated px-3 py-2 text-xs text-text outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/30"
          aria-label="Assign to workspace member"
        >
          <option value="">External / unassigned</option>
          {members.map((member) => (
            <option key={member.userId} value={member.userId}>
              {member.label} ({member.email})
            </option>
          ))}
        </select>
      ) : null}
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          disabled={Boolean(assigneeUserId)}
          maxLength={120}
          placeholder="Name"
          className="rounded-md border border-border bg-bg-elevated px-3 py-2 text-xs text-text outline-none transition-colors placeholder:text-text-subtle focus:border-accent focus:ring-2 focus:ring-accent/30 disabled:opacity-50"
        />
        <input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={Boolean(assigneeUserId)}
          maxLength={254}
          placeholder="email@example.com"
          className="rounded-md border border-border bg-bg-elevated px-3 py-2 text-xs text-text outline-none transition-colors placeholder:text-text-subtle focus:border-accent focus:ring-2 focus:ring-accent/30 disabled:opacity-50"
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
