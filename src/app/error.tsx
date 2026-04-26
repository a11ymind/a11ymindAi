"use client";

import Link from "next/link";
import { Logo } from "@/components/Logo";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorPageProps) {
  return (
    <main className="page-shell-gradient flex min-h-screen flex-col">
      <header className="container-page py-6">
        <Link href="/" aria-label="a11ymind AI home" className="inline-flex items-center">
          <Logo />
        </Link>
      </header>
      <div className="container-page flex flex-1 flex-col items-center justify-center py-24 text-center">
        <p className="section-kicker mb-6">Unexpected error</p>
        <h1 className="text-4xl font-semibold tracking-tight text-text sm:text-5xl">
          Something went wrong
        </h1>
        <p className="mt-4 max-w-md text-base text-text-muted">
          An unexpected error occurred. Try refreshing the page.
        </p>
        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
          <button type="button" onClick={() => reset()} className="btn-primary">
            Try again
          </button>
          <Link href="/" className="btn-ghost">
            Go home
          </Link>
        </div>
        {error.digest ? (
          <p className="mt-8 text-xs text-text-muted/70">
            Reference: <span className="font-mono">{error.digest}</span>
          </p>
        ) : null}
      </div>
    </main>
  );
}
