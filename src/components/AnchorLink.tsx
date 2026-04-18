"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export function AnchorLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const match = href.match(/^(\/?)#(.+)$/);
  const targetPath = match?.[1] === "/" ? "/" : null;
  const targetId = match?.[2] ?? null;

  function onClick(e: React.MouseEvent<HTMLAnchorElement>) {
    if (!targetId) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;

    if (targetPath && pathname !== targetPath) {
      // Different page — let Next navigate, then scroll on the next tick.
      e.preventDefault();
      router.push(targetPath);
      requestAnimationFrame(() => scrollToId(targetId));
      return;
    }

    e.preventDefault();
    scrollToId(targetId);
    // Keep the URL clean — no trailing "#section" in the address bar.
    window.history.replaceState(null, "", pathname || "/");
  }

  return (
    <Link href={href} className={className} onClick={onClick}>
      {children}
    </Link>
  );
}

function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}
