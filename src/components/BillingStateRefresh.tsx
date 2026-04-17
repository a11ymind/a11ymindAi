"use client";

import { useEffect, useRef, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

// After a Stripe Checkout success redirect, Stripe's webhook is still
// in-flight — so the user's row in our DB may still show the old plan.
// We proactively hit /api/stripe/sync to pull the latest subscription
// state directly from Stripe, then refresh the JWT session, then re-render
// the current server component tree.
export function BillingStateRefresh({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const { update } = useSession();
  const ran = useRef(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (!enabled || ran.current) return;
    ran.current = true;

    (async () => {
      try {
        await fetch("/api/stripe/sync", {
          method: "POST",
          cache: "no-store",
        });
      } catch {
        // Swallow — update() below will still run and the webhook will
        // eventually reconcile.
      }
      try {
        await update();
      } finally {
        startTransition(() => {
          // Strip ?upgraded=1 so bookmarking/refreshing doesn't re-trigger
          // the sync on every load. router.replace also re-renders RSC tree.
          router.replace(pathname);
        });
      }
    })();
  }, [enabled, pathname, router, startTransition, update]);

  return null;
}
