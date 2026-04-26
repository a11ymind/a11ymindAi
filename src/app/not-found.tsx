import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function NotFound() {
  return (
    <main className="page-shell-gradient flex min-h-screen flex-col">
      <header className="container-page py-6">
        <Link href="/" aria-label="a11ymind AI home" className="inline-flex items-center">
          <Logo />
        </Link>
      </header>
      <div className="container-page flex flex-1 flex-col items-center justify-center py-24 text-center">
        <p className="section-kicker mb-6">Error 404</p>
        <h1 className="gradient-text text-[clamp(5rem,18vw,12rem)] font-bold leading-none tracking-tight">
          404
        </h1>
        <h2 className="mt-6 text-3xl font-semibold text-text sm:text-4xl">
          Page not found
        </h2>
        <p className="mt-4 max-w-md text-base text-text-muted">
          This page doesn&apos;t exist or has been moved.
        </p>
        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
          <Link href="/" className="btn-primary">
            Go home
          </Link>
          <Link href="/dashboard" className="btn-ghost">
            Open dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
