"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import Script from "next/script";
import { safeAppRedirectPath } from "@/lib/redirects";

type Mode = "login" | "signup";

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        opts: {
          sitekey: string;
          theme?: "light" | "dark" | "auto";
          callback?: (token: string) => void;
          "error-callback"?: () => void;
          "expired-callback"?: () => void;
        },
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
  }
}

export function AuthForm({
  mode,
  googleEnabled,
  githubEnabled,
  turnstileSiteKey,
}: {
  mode: Mode;
  googleEnabled: boolean;
  githubEnabled: boolean;
  turnstileSiteKey: string | null;
}) {
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
  const socialEnabled = googleEnabled || githubEnabled;

  const turnstileRequired = mode === "signup" && Boolean(turnstileSiteKey);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileReady, setTurnstileReady] = useState(false);
  const turnstileContainerRef = useRef<HTMLDivElement | null>(null);
  const turnstileWidgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!turnstileRequired || !turnstileReady || !turnstileSiteKey) return;
    const el = turnstileContainerRef.current;
    const api = window.turnstile;
    if (!el || !api) return;
    if (turnstileWidgetIdRef.current) return;
    turnstileWidgetIdRef.current = api.render(el, {
      sitekey: turnstileSiteKey,
      theme: "dark",
      callback: (token) => setTurnstileToken(token),
      "expired-callback": () => setTurnstileToken(null),
      "error-callback": () => setTurnstileToken(null),
    });
    return () => {
      if (turnstileWidgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(turnstileWidgetIdRef.current);
        } catch {
          // Widget may already be gone on fast nav.
        }
        turnstileWidgetIdRef.current = null;
      }
    };
  }, [turnstileRequired, turnstileReady, turnstileSiteKey]);

  function resetTurnstile() {
    setTurnstileToken(null);
    if (turnstileWidgetIdRef.current && window.turnstile) {
      try {
        window.turnstile.reset(turnstileWidgetIdRef.current);
      } catch {
        // Ignore reset races.
      }
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    if (turnstileRequired && !turnstileToken) {
      setError("Please complete the bot check below before continuing.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (mode === "signup") {
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            email,
            password,
            name: name || undefined,
            turnstileToken: turnstileToken || undefined,
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          resetTurnstile();
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

  function onGitHub() {
    signIn("github", { callbackUrl });
  }

  return (
    <div className="w-full max-w-sm">
      {turnstileRequired && (
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
          strategy="afterInteractive"
          onLoad={() => setTurnstileReady(true)}
          onReady={() => setTurnstileReady(true)}
        />
      )}
      <h1 className="text-2xl font-semibold tracking-tight">
        {mode === "login" ? "Welcome back" : "Create your a11ymind account"}
      </h1>
      <p className="mt-1 text-sm text-text-muted">
        {mode === "login"
          ? "Log in to review reports, monitor saved sites, and manage billing."
          : "Save scans, track accessibility changes over time, and unlock paid workflows when you need them."}
        {scanId && (
          <span className="mt-2 block rounded-md border border-accent-muted bg-accent-muted/20 px-3 py-2 text-xs text-accent">
            Your recent scan will be attached to your account so you can keep working from that result.
          </span>
        )}
      </p>

      {socialEnabled && (
        <>
          <div className="mt-6 space-y-3">
            {googleEnabled && (
              <button
                type="button"
                onClick={onGoogle}
                className="btn-ghost w-full"
                disabled={loading}
              >
                <GoogleIcon />
                <span className="ml-2">Continue with Google</span>
              </button>
            )}
            {githubEnabled && (
              <button
                type="button"
                onClick={onGitHub}
                className="btn-ghost w-full"
                disabled={loading}
              >
                <GitHubIcon />
                <span className="ml-2">Continue with GitHub</span>
              </button>
            )}
          </div>
          <div className="my-5 flex items-center gap-3 text-xs text-text-subtle">
            <span className="h-px flex-1 bg-border" />
            or continue with email
            <span className="h-px flex-1 bg-border" />
          </div>
        </>
      )}

      <form onSubmit={onSubmit} className={`space-y-3 ${socialEnabled ? "" : "mt-6"}`}>
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

        {turnstileRequired && (
          <div
            ref={turnstileContainerRef}
            className="flex justify-center"
            aria-label="Bot verification"
          />
        )}

        {error && (
          <p className="text-sm text-severity-critical" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          className="btn-primary w-full"
          disabled={loading || (turnstileRequired && !turnstileToken)}
        >
          {loading
            ? mode === "login"
              ? "Logging in…"
              : "Creating account…"
            : mode === "login"
              ? "Log in"
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
      <p className="mt-3 text-center text-xs leading-relaxed text-text-subtle">
        By continuing, you agree to our{" "}
        <Link href="/terms" className="text-accent hover:underline">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="text-accent hover:underline">
          Privacy Policy
        </Link>
        .
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

function GitHubIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M12 .5C5.65.5.5 5.66.5 12.02c0 5.09 3.29 9.41 7.86 10.94.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.55-3.88-1.55-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.02 1.76 2.68 1.25 3.34.95.1-.74.4-1.25.73-1.54-2.56-.29-5.26-1.28-5.26-5.72 0-1.26.45-2.3 1.19-3.11-.12-.29-.52-1.47.11-3.06 0 0 .97-.31 3.19 1.19a11.08 11.08 0 0 1 5.81 0c2.22-1.5 3.19-1.19 3.19-1.19.63 1.59.23 2.77.11 3.06.74.81 1.19 1.85 1.19 3.11 0 4.45-2.7 5.42-5.28 5.7.41.35.78 1.04.78 2.11 0 1.52-.01 2.75-.01 3.12 0 .31.21.67.8.56A11.53 11.53 0 0 0 23.5 12C23.5 5.66 18.35.5 12 .5Z" />
    </svg>
  );
}
