"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function WorkspaceInviteForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"ADMIN" | "MEMBER" | "VIEWER">("MEMBER");
  const [acceptUrl, setAcceptUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function submitInvite(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim() || isSaving) return;

    setIsSaving(true);
    setError(null);
    setAcceptUrl(null);
    try {
      const res = await fetch("/api/workspace/invites", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, role }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not create invite.");
      setEmail("");
      setAcceptUrl(data.acceptUrl ?? null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create invite.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={submitInvite} className="mt-4 grid gap-2 md:grid-cols-[1fr_auto_auto]">
      <input
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        type="email"
        placeholder="teammate@example.com"
        className="input-field py-2 text-sm"
      />
      <select
        value={role}
        onChange={(event) => setRole(event.target.value as "ADMIN" | "MEMBER" | "VIEWER")}
        className="rounded-md border border-border bg-bg-elevated/80 px-3 py-2 text-sm text-text"
      >
        <option value="ADMIN">Admin</option>
        <option value="MEMBER">Member</option>
        <option value="VIEWER">Viewer</option>
      </select>
      <button
        type="submit"
        disabled={!email.trim() || isSaving}
        className="btn-primary text-sm disabled:pointer-events-none disabled:opacity-50"
      >
        {isSaving ? "Inviting..." : "Invite"}
      </button>
      {acceptUrl ? (
        <p className="text-xs text-text-subtle md:col-span-3">
          Invite created. Acceptance path: <span className="font-mono text-text">{acceptUrl}</span>
        </p>
      ) : null}
      {error ? <p className="text-xs text-severity-critical md:col-span-3">{error}</p> : null}
    </form>
  );
}
