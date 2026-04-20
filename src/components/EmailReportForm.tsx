"use client";

import { useState } from "react";

export function EmailReportForm({ scanId }: { scanId: string }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (state === "sending") return;
    setState("sending");
    setError(null);

    try {
      const res = await fetch(`/api/scan/${scanId}/email`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Could not send the email.");
      }
      setState("sent");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send the email.");
      setState("error");
    }
  }

  if (state === "sent") {
    return (
      <p className="mt-3 text-xs text-accent">
        Sent. Check your inbox — the report link stays live so you can revisit it anytime.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-start">
      <label htmlFor={`scan-email-${scanId}`} className="sr-only">
        Email address
      </label>
      <input
        id={`scan-email-${scanId}`}
        className="input flex-1"
        type="email"
        autoComplete="email"
        required
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={state === "sending"}
      />
      <button type="submit" className="btn-ghost whitespace-nowrap text-sm" disabled={state === "sending"}>
        {state === "sending" ? "Sending…" : "Send my report"}
      </button>
      {error ? (
        <p className="text-xs text-severity-critical sm:w-full">{error}</p>
      ) : null}
    </form>
  );
}
