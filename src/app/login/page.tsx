import { Suspense } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { AuthForm } from "@/components/AuthForm";
import { googleEnabled } from "@/lib/auth";

export const metadata = { title: "Log in — Accessly" };

export default function LoginPage() {
  return (
    <main className="min-h-screen">
      <header className="container-page flex items-center justify-between py-6">
        <Link href="/">
          <Logo />
        </Link>
      </header>
      <div className="container-page flex justify-center py-16">
        <Suspense fallback={null}>
          <AuthForm mode="login" googleEnabled={googleEnabled} />
        </Suspense>
      </div>
    </main>
  );
}
