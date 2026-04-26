import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/Logo";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SettingsClient } from "./SettingsClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Settings — a11ymind AI",
};

export default async function SettingsPage(): Promise<JSX.Element> {
  const session = await getSession();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      plan: true,
      emailWeeklyDigest: true,
      emailScanAlerts: true,
      stripeCustomerId: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border/60 bg-bg/70 backdrop-blur-xl">
        <div className="container-page flex flex-wrap items-center justify-between gap-3 py-4">
          <Link href="/" aria-label="a11ymind AI home" className="flex items-center">
            <Logo />
          </Link>
          <Link href="/dashboard" className="btn-ghost">
            Dashboard
          </Link>
        </div>
      </header>

      <main id="main" className="page-shell-gradient min-h-screen">
        <div className="container-page py-10">
          <div className="mb-8 flex flex-col gap-2">
            <p className="section-kicker">Settings</p>
            <h1 className="text-3xl font-semibold tracking-tight text-text">
              Account &amp; preferences
            </h1>
            <p className="max-w-2xl text-sm text-text-muted">
              Manage how a11ymind AI represents you, what we send to your inbox, and your subscription.
            </p>
          </div>

          <SettingsClient
            initialName={user.name ?? ""}
            email={user.email}
            initialEmailWeeklyDigest={user.emailWeeklyDigest}
            initialEmailScanAlerts={user.emailScanAlerts}
          />
        </div>
      </main>
    </>
  );
}
