import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-bg-elevated/40">
      <div className="container-page flex flex-col items-center justify-between gap-4 py-6 text-sm text-text-muted sm:flex-row">
        <p>&copy; 2025 a11ymind AI</p>
        <nav aria-label="Footer" className="flex items-center gap-5">
          <Link
            href="/privacy"
            className="rounded-sm transition-colors hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Privacy
          </Link>
          <Link
            href="/terms"
            className="rounded-sm transition-colors hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Terms
          </Link>
          <a
            href="mailto:support@a11ymind.ai"
            className="rounded-sm transition-colors hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Support
          </a>
        </nav>
      </div>
    </footer>
  );
}
