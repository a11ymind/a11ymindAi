"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { safeAppRedirectPath } from "@/lib/redirects";

type Mode = "login" | "signup";

export function AuthForm({ mode, googleEnabled }: { mode: Mode; googleEnabled: boolean }) {
  const router = useRouter();
  const params = useSearchParams();
  const scanId = params.get("scanId");
  const requestedCallbackUrl = safeAppRedirectPath(params.get("callbackUrl"), "/dashboard");
  const callbackUrl = scanId ? `/claim/${scanId}` : requestedCallbackUrl;
  const authLinkSuffix = scanId
    ? `?scanId=${encodeURIComponent(scanId)}`
    : requestedCallbackUrl !== "/dashboard"
      ? `?callbackUrl=${encodeURIComponent(requestedCallbackUrl)}`
      : "";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      if (mode === "signup") {
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email, password, name: name || undefined }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Could not create account");
        }
      }
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl,
      });
      if (!result || result.error) {
        throw new Error(
          mode === "signup"
            ? "Account created but sign-in failed. Try logging in."
            : "Invalid email or password",
        );
      }
      router.push(result.url || callbackUrl);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  function onGoogle() {
    signIn("google", { callbackUrl });
  }

  return (
    <div className="w-full max-w-sm">
      <h1 className="text-2xl font-semibold tracking-tight">
        {mode === "login" ? "Welcome back" : "Create your account"}
      </h1>
      <p className="mt-1 text-sm text-text-muted">
        {mode === "login"
          ? "Log in to view your scan history and manage sites."
          : "Save your scans and track compliance over time."}
        {scanId && (
          <span className="mt-2 block rounded-md border border-accent-muted bg-accent-muted/20 px-3 py-2 text-xs text-accent">
            Your recent scan will be attached to your account.
          </span>
        )}
      </p>

      {googleEnabled && (
        <>
          <button
            type="button"
            onClick={onGoogle}
            className="btn-ghost mt-6 w-full"
            disabled={loading}
          >
            <GoogleIcon />
            <span className="ml-2">Continue with Google</span>
          </button>
          <div className="my-5 flex items-center gap-3 text-xs text-text-subtle">
            <span className="h-px flex-1 bg-border" />
            or continue with email
            <span className="h-px flex-1 bg-border" />
          </div>
        </>
      )}

      <form onSubmit={onSubmit} className={`space-y-3 ${googleEnabled ? "" : "mt-6"}`}>
        {mode === "signup" && (
          <Field label="Name (optional)">
            <input
              className="input"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
            />
          </Field>
        )}
        <Field label="Email">
          <input
            className="input"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
        </Field>
        <Field label="Password">
          <input
            className="input"
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
          {mode === "signup" && (
            <p className="mt-1 text-xs text-text-subtle">At least 8 characters.</p>
          )}
        </Field>

        {error && (
          <p className="text-sm text-severity-critical" role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading
            ? mode === "login"
              ? "Signing in…"
              : "Creating account…"
            : mode === "login"
              ? "Sign in"
              : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-text-muted">
        {mode === "login" ? (
          <>
            Don&apos;t have an account?{" "}
            <Link
              href={`/signup${authLinkSuffix}`}
              className="text-accent hover:underline"
            >
              Sign up
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link
              href={`/login${authLinkSuffix}`}
              className="text-accent hover:underline"
            >
              Log in
            </Link>
          </>
        )}
      </p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs uppercase tracking-wider text-text-subtle">
        {label}
      </span>
      {children}
    </label>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20.4H24v7.2h11.3c-1.5 4.2-5.5 7.2-11.3 7.2-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.1-5.1C33.7 5.9 29.1 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11.5 0 19.6-8.1 19.6-20 0-1.2-.1-2.4-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="m6.3 14.7 5.9 4.3C13.8 15.2 18.5 12 24 12c3.1 0 5.9 1.2 8 3.1l5.1-5.1C33.7 5.9 29.1 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.1 0 9.7-2 13.2-5.1l-6.1-5c-2 1.4-4.6 2.2-7.1 2.2-5.7 0-10.5-3.7-12.1-8.8l-5.9 4.6C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20.4H24v7.2h11.3c-.7 2-2 3.7-3.7 5l6.1 5c-.4.4 6.7-4.9 6.7-13.6 0-1.2-.1-2.4-.4-3.5z"
      />
    </svg>
  );
}
