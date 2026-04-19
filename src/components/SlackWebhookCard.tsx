"use client";

import { useState } from "react";

export function SlackWebhookCard({
  siteId,
  configured,
}: {
  siteId: string;
  configured: boolean;
}) {
  const [webhookUrl, setWebhookUrl] = useState("");
  const [isConfigured, setIsConfigured] = useState(configured);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function save(nextWebhookUrl: string) {
    if (saving) return;
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch(`/api/site/${siteId}/slack`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ webhookUrl: nextWebhookUrl }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Could not save Slack webhook");
      }

      setWebhookUrl("");
      setIsConfigured(Boolean(data.configured));
      setMessage(data.configured ? "Slack alerts are configured." : "Slack alerts were removed.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save Slack webhook");
    } finally {
      setSaving(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    await save(webhookUrl);
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-text-subtle">
        Slack alerts
      </p>
      <p className="mt-1 text-sm text-text">
        Send a Slack alert when scheduled monitoring finds new accessibility risks
        or the score drops.
      </p>
      <p className="mt-1 text-xs text-text-muted">
        {isConfigured
          ? "A webhook is already configured for this site. Paste a new one to replace it, or submit an empty field to remove it."
          : "Paste a Slack incoming webhook URL for this site."}
      </p>

      <form onSubmit={onSubmit} className="mt-4 space-y-3">
        <input
          className="input"
          type="url"
          placeholder="https://hooks.slack.com/services/..."
          value={webhookUrl}
          onChange={(e) => setWebhookUrl(e.target.value)}
          disabled={saving}
        />
        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" className="btn-primary text-sm" disabled={saving}>
            {saving ? "Saving…" : isConfigured ? "Update Slack webhook" : "Save Slack webhook"}
          </button>
          {isConfigured && (
            <button
              type="button"
              className="btn-ghost text-sm"
              disabled={saving}
              onClick={() => {
                setWebhookUrl("");
                void save("");
              }}
            >
              Remove webhook
            </button>
          )}
        </div>
      </form>

      {message ? <p className="mt-3 text-xs text-accent">{message}</p> : null}
      {error ? <p className="mt-3 text-xs text-severity-critical">{error}</p> : null}
    </div>
  );
}
