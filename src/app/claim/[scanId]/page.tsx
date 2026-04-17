import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { entitlementsFor, isAtSiteLimit } from "@/lib/entitlements";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ClaimPage({ params }: { params: { scanId: string } }) {
  const session = await getSession();
  if (!session?.user?.id) {
    redirect(`/login?scanId=${encodeURIComponent(params.scanId)}`);
  }
  const userId = session.user.id;

  const [scan, user] = await Promise.all([
    prisma.scan.findUnique({ where: { id: params.scanId } }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true },
    }),
  ]);
  if (!scan) redirect("/dashboard");
  if (scan.userId && scan.userId !== userId) redirect("/dashboard");

  const userPlan = user?.plan ?? "FREE";
  const limits = entitlementsFor(userPlan);
  const existingSite = await prisma.site.findUnique({
    where: { userId_url: { userId, url: scan.url } },
    select: { id: true },
  });

  if (!existingSite) {
    const siteCount = await prisma.site.count({ where: { userId } });
    if (isAtSiteLimit(userPlan, siteCount)) {
      redirect(
        `/scan/${scan.id}?limit=site_limit&plan=${userPlan}&maxSites=${limits.maxSites}`,
      );
    }
  }

  const site = await prisma.site.upsert({
    where: { userId_url: { userId, url: scan.url } },
    create: { userId, url: scan.url },
    update: {},
  });

  await prisma.scan.update({
    where: { id: scan.id },
    data: { userId, siteId: site.id },
  });

  redirect("/dashboard");
}
