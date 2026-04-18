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
                />
              </Suspense>
            </div>
            <p className="mt-5 text-center text-xs text-text-subtle">
              Protected by standard security. We never store third-party passwords.
            </p>
          </div>
        </div>
      </div>
      </main>
    </>
  );
}
