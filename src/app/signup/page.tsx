import { Suspense } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { AuthForm } from "@/components/AuthForm";
import { githubEnabled, googleEnabled } from "@/lib/auth";

export const metadata = { title: "Sign up — Accessly" };

export default function SignupPage() {
  return (
    <main className="min-h-screen">
      <header className="container-page flex items-center justify-between py-6">
        <Link href="/">
          <Logo />
        </Link>
      </header>
      <div className="container-page flex justify-center py-16">
        <Suspense fallback={null}>
          <AuthForm
            mode="signup"
            googleEnabled={googleEnabled}
            githubEnabled={githubEnabled}
          />
        </Suspense>
      </div>
    </main>
  );
}
