"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface SettingsClientProps {
  initialName: string;
  email: string;
  initialEmailWeeklyDigest: boolean;
  initialEmailScanAlerts: boolean;
}

type SaveState = "idle" | "saving" | "saved" | "error";

async function patchSettings(payload: Record<string, unknown>): Promise<boolean> {
  try {
    const res = await fetch("/api/user/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export function SettingsClient({
  initialName,
  email,
  initialEmailWeeklyDigest,
  initialEmailScanAlerts,
}: SettingsClientProps): JSX.Element {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [emailWeeklyDigest, setEmailWeeklyDigest] = useState(initialEmailWeeklyDigest);
  const [emailScanAlerts, setEmailScanAlerts] = useState(initialEmailScanAlerts);
  const [nameSaveState, setNameSaveState] = useState<SaveState>("idle");
  const [toggleError, setToggleError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleSaveName(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setNameSaveState("saving");
    const ok = await patchSettings({ name: name.trim() });
    if (ok) {
      setNameSaveState("saved");
      router.refresh();
      window.setTimeout(() => setNameSaveState("idle"), 2000);
    } else {
      setNameSaveState("error");
    }
  }

  async function handleToggle(
    field: "emailWeeklyDigest" | "emailScanAlerts",
    nextValue: boolean,
  ): Promise<void> {
    const previous = field === "emailWeeklyDigest" ? emailWeeklyDigest : emailScanAlerts;
    if (field === "emailWeeklyDigest") setEmailWeeklyDigest(nextValue);
    else setEmailScanAlerts(nextValue);

    setToggleError(null);
    const ok = await patchSettings({ [field]: nextValue });
    if (!ok) {
      // Roll back on failure
      if (field === "emailWeeklyDigest") setEmailWeeklyDigest(previous);
      else setEmailScanAlerts(previous);
      setToggleError("Could not save preference. Please try again.");
    }
  }

  async function handleDeleteAccount(): Promise<void> {
    const confirmed = window.confirm(
      "Delete your account permanently? This cancels your subscription and removes all monitored pages and scan history. This cannot be undone.",
    );
    if (!confirmed) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/user/settings", { method: "DELETE" });
      if (res.ok) {
        window.location.href = "/";
        return;
      }
      setDeleting(false);
      window.alert("Could not delete account. Please contact support.");
    } catch {
      setDeleting(false);
      window.alert("Could not delete account. Please contact support.");
    }
  }

  return (
    <div className="flex flex-col gap-10">
      {/* Section 1 — Profile */}
      <section aria-labelledby="profile-heading" className="card p-6">
        <p className="section-kicker">Account</p>
        <h2 id="profile-heading" className="mt-1 text-xl font-semibold text-text">
          Profile
        </h2>
        <p className="mt-1 text-sm text-text-muted">
          Your display name shows up in shared scan reports and email notifications.
        </p>

        <form onSubmit={handleSaveName} className="mt-6 flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label htmlFor="display-name" className="text-sm font-medium text-text">
              Display name
            </label>
            <input
              id="display-name"
              type="text"
              className="input"
              value={name}
              maxLength={100}
              onChange={(event) => setName(event.target.value)}
              autoComplete="name"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="email-readonly" className="text-sm font-medium text-text">
              Email address
            </label>
            <input
              id="email-readonly"
              type="email"
              readOnly
              aria-readonly="true"
              className="input cursor-not-allowed bg-bg-muted/40 text-text-muted"
              value={email}
            />
            <p className="text-xs text-text-muted">
              Email is tied to your authentication provider and can't be changed here.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="btn-primary"
              disabled={nameSaveState === "saving" || name.trim() === initialName.trim()}
            >
              {nameSaveState === "saving" ? "Saving…" : "Save changes"}
            </button>
            {nameSaveState === "saved" && (
              <span className="text-sm text-emerald-400" role="status">
                Saved
              </span>
            )}
            {nameSaveState === "error" && (
              <span className="text-sm text-red-400" role="alert">
                Could not save. Try again.
              </span>
            )}
          </div>
        </form>
      </section>

      {/* Section 2 — Email notifications */}
      <section aria-labelledby="notifications-heading" className="card p-6">
        <p className="section-kicker">Notifications</p>
        <h2 id="notifications-heading" className="mt-1 text-xl font-semibold text-text">
          Email notifications
        </h2>
        <p className="mt-1 text-sm text-text-muted">
          Choose what we send to your inbox. Changes save automatically.
        </p>

        <ul className="mt-6 flex flex-col divide-y divide-border/60">
          <ToggleRow
            id="weekly-digest-toggle"
            label="Weekly digest"
            description="Receive a weekly summary of your accessibility scores and issue trends."
            checked={emailWeeklyDigest}
            onChange={(value) => handleToggle("emailWeeklyDigest", value)}
          />
          <ToggleRow
            id="scan-alerts-toggle"
            label="Scan completion alerts"
            description="Get notified when a monitored page regression is detected."
            checked={emailScanAlerts}
            onChange={(value) => handleToggle("emailScanAlerts", value)}
          />
        </ul>

        {toggleError && (
          <p className="mt-4 text-sm text-red-400" role="alert">
            {toggleError}
          </p>
        )}
      </section>

      {/* Section 3 — Danger zone */}
      <section
        aria-labelledby="danger-heading"
        className="card border-red-500/30 bg-red-500/5 p-6"
      >
        <p className="section-kicker text-red-300/80">Irreversible</p>
        <h2 id="danger-heading" className="mt-1 text-xl font-semibold text-text">
          Danger zone
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-text-muted">
          This permanently deletes your account, all monitored pages, scan history, and cancels your subscription.
        </p>
        <button
          type="button"
          onClick={handleDeleteAccount}
          disabled={deleting}
          className="mt-5 inline-flex items-center justify-center rounded-md border border-red-500/50 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-200 transition-colors hover:bg-red-500/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {deleting ? "Deleting account…" : "Delete account"}
        </button>
      </section>
    </div>
  );
}

interface ToggleRowProps {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}

function ToggleRow({ id, label, description, checked, onChange }: ToggleRowProps): JSX.Element {
  return (
    <li className="flex items-start justify-between gap-6 py-4 first:pt-0 last:pb-0">
      <div className="flex flex-col gap-1">
        <label htmlFor={id} className="text-sm font-medium text-text">
          {label}
        </label>
        <p className="text-sm text-text-muted">{description}</p>
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
          checked
            ? "border-accent/60 bg-accent/70"
            : "border-border/80 bg-bg-muted/60"
        }`}
      >
        <span
          aria-hidden="true"
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </li>
  );
}
