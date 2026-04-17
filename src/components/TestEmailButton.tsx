"use client";

import { useState } from "react";

type TestEmailState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "success"; message: string }
  | { kind: "error"; message: string };

export function TestEmailButton({ disabled }: { disabled: boolean }) {
  const [state, setState] = useState<TestEmailState>({ kind: "idle" });

  async function onClick() {
    if (disabled || state.kind === "loading") return;

    setState({ kind: "loading" });

    try {
      const res = await fetch("/api/email/test", {
        method: "POST",
      });
      const data = (await res.json().catch(() => null)) as
        | { ok?: boolean; message?: string; error?: string }
        | null;

      if (!res.ok) {
        throw new Error(data?.error || "Could not send test email.");
      }

      setState({
        kind: "success",
        message: data?.message || "Test email sent.",
      });
    } catch (error) {
      setState({
        kind: "error",
        message: error instanceof Error ? error.message : "Could not send test email.",
      });
    }
  }

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled || state.kind === "loading"}
        className="btn-primary text-sm disabled:cursor-not-allowed disabled:opacity-60"
      >
        {state.kind === "loading" ? "Sending test email..." : "Send test email"}
      </button>
      {disabled ? (
        <p className="mt-2 text-xs text-text-subtle">
          Configure `RESEND_API_KEY` and `RESEND_FROM_EMAIL` first.
        </p>
      ) : null}
      {state.kind === "success" ? (
        <p className="mt-2 text-xs text-accent">{state.message}</p>
      ) : null}
      {state.kind === "error" ? (
        <p className="mt-2 text-xs text-severity-critical">{state.message}</p>
      ) : null}
    </div>
  );
}
