import Link from "next/link";
import type { Plan } from "@prisma/client";
import { Logo } from "@/components/Logo";
import { PlanBadge } from "@/components/PlanBadge";
import { SignOutButton } from "@/components/UserMenu";

type AppHeaderProps = {
  user: {
    name: string | null;
    email: string;
    plan: Plan;
  };
  active?: "dashboard" | "monitoring" | "issues" | "scans" | "settings";
};

const NAV_ITEMS: { href: string; label: string; key: AppHeaderProps["active"] }[] = [
  { href: "/dashboard", label: "Dashboard", key: "dashboard" },
  { href: "/monitoring", label: "Monitoring", key: "monitoring" },
  { href: "/issues", label: "Issues", key: "issues" },
  { href: "/scans", label: "History", key: "scans" },
  { href: "/settings", label: "Settings", key: "settings" },
];

export function AppHeader({ user, active }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-bg/70 backdrop-blur-xl">
      <div className="container-page flex flex-wrap items-center justify-between gap-3 py-4">
        <div className="flex flex-wrap items-center gap-6">
          <Link href="/" aria-label="a11ymind AI home" className="flex items-center">
            <Logo />
          </Link>
          <nav aria-label="Primary" className="hidden flex-wrap gap-1 md:flex">
            {NAV_ITEMS.map((item) => {
              const isActive = item.key === active;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                    isActive
                      ? "bg-white/[0.06] text-text"
                      : "text-text-muted hover:bg-white/[0.04] hover:text-text"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex min-w-0 flex-wrap items-center justify-end gap-2 sm:gap-3">
          <PlanBadge plan={user.plan} />
          {user.plan === "FREE" ? (
            <Link
              href="/pricing"
              className="hidden rounded-md border border-accent/40 bg-accent/10 px-3 py-1.5 text-sm font-medium text-accent transition-colors hover:bg-accent/20 sm:inline-flex"
            >
              Unlock AI fixes
            </Link>
          ) : (
            <a
              href="/api/stripe/portal"
              className="hidden text-sm text-text-muted transition-colors hover:text-text sm:inline"
            >
              Manage billing
            </a>
          )}
          <span className="hidden max-w-[14rem] truncate text-sm text-text-muted md:inline">
            {user.name || user.email}
          </span>
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}
