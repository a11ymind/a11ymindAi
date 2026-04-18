import Link from "next/link";
import { Logo } from "@/components/Logo";
import { AnchorLink } from "@/components/AnchorLink";
import { getSession } from "@/lib/auth";

export async function SiteHeader({
  variant = "marketing",
}: {
  variant?: "marketing" | "minimal";
}) {
  const session = variant === "minimal" ? null : await getSession();

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-accent focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-bg"
      >
        Skip to main content
      </a>
      <header className="sticky top-0 z-40 border-b border-border/60 bg-bg/70 backdrop-blur-xl">
        <div className="container-page flex items-center justify-between gap-3 py-4">
          <Link href="/" aria-label="a11ymind AI home" className="flex min-w-0 items-center">
            <Logo />
          </Link>
          {variant === "marketing" && (
            <nav aria-label="Primary" className="flex items-center gap-1 sm:gap-2">
              <AnchorLink
                href="/#how-it-works"
                className="hidden rounded-md px-3 py-1.5 text-sm text-text-muted transition-colors hover:bg-bg-elevated/60 hover:text-text sm:inline-block"
              >
                How it works
              </AnchorLink>
              <AnchorLink
                href="/#faq"
                className="hidden rounded-md px-3 py-1.5 text-sm text-text-muted transition-colors hover:bg-bg-elevated/60 hover:text-text sm:inline-block"
              >
                FAQ
              </AnchorLink>
              <HeaderLink href="/pricing">Pricing</HeaderLink>
              {session?.user ? (
                <Link
                  href="/dashboard"
                  className="rounded-md bg-bg-elevated/80 px-3 py-1.5 text-sm text-text transition-colors hover:bg-bg-elevated"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <HeaderLink href="/login">Log in</HeaderLink>
                  <Link
                    href="/signup"
                    className="inline-flex items-center gap-1 rounded-md border border-accent/50 bg-accent/10 px-3 py-1.5 text-sm font-medium text-accent transition-colors hover:bg-accent/20"
                  >
                    Run a free scan
                    <span aria-hidden>→</span>
                  </Link>
                </>
              )}
            </nav>
          )}
        </div>
      </header>
    </>
  );
}

function HeaderLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="hidden rounded-md px-3 py-1.5 text-sm text-text-muted transition-colors hover:bg-bg-elevated/60 hover:text-text sm:inline-block"
    >
      {children}
    </Link>
  );
}
