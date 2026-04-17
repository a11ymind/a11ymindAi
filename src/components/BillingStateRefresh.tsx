"use client";

import { useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export function BillingStateRefresh({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const { update } = useSession();
  const ran = useRef(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (!enabled || ran.current) return;
    ran.current = true;

    void update().finally(() => {
      startTransition(() => {
        router.refresh();
      });
    });
  }, [enabled, router, startTransition, update]);

  return null;
}
