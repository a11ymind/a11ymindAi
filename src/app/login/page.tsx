import { Suspense } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { AuthForm } from "@/components/AuthForm";
import { githubEnabled, googleEnabled } from "@/lib/auth";

export const metadata = { title: "Log in — a11ymind AI" };

export default function LoginPage() {
  return (
    <>
      <SiteHeader variant="minimal" />
      <main id="main" className="min-h-screen">
      <div className="relative overflow-hidden">
        <div className="aurora" aria-hidden="true" />
        <div className="container-page relative flex flex-col items-center py-16 sm:py-24">
          <div className="w-full max-w-sm">
            <div className="card gradient-border p-7 shadow-glow">
              <Suspense fallback={null}>
                <AuthForm
                  mode="login"
                  googleEnabled={googleEnabled}
                  githubEnabled={githubEnabled}
                  turnstileSiteKey={null}
                />
              </Suspense>
            </div>
            <ul className="mt-6 space-y-2 text-xs text-text-subtle">
              <li className="flex items-center gap-2">
                <Check /> Return to your saved scans and monitored sites
              </li>
              <li className="flex items-center gap-2">
                <Check /> Open reports, billing, and diagnostics in one place
              </li>
              <li className="flex items-center gap-2">
                <Check /> We never store third-party passwords
              </li>
            </ul>
          </div>
        </div>
      </div>
      </main>
    </>
  );
}

function Check() {
  return (
    <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 text-accent" fill="none" aria-hidden="true">
      <path
        d="m4 10 4 4 8-8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
