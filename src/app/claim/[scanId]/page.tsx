import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { entitlementsFor } from "@/lib/entitlements";
import { prisma } from "@/lib/prisma";
import { ensureProjectPageForUrl } from "@/lib/projects";

export const dynamic = "force-dynamic";

export default async function ClaimPage({ params }: { params: Promise<{ scanId: string }> }) {
  const { scanId } = await params;
  const session = await getSession();
  if (!session?.user?.id) {
    redirect(`/login?scanId=${encodeURIComponent(scanId)}`);
  }
  const userId = session.user.id;

  const [scan, user] = await Promise.all([
    prisma.scan.findUnique({ where: { id: scanId } }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true },
    }),
  ]);
  if (!scan) redirect("/dashboard?error=claim_unavailable");
  if (scan.userId && scan.userId !== userId) {
    redirect("/dashboard?error=claim_unavailable");
  }

  if (scan.userId === userId && scan.siteId) {
    redirect(`/scan/${scan.id}?claimed=1`);
  }

  const userPlan = user?.plan ?? "FREE";
  const limits = entitlementsFor(userPlan);
  const normalized = new URL(scan.url);
  const origin = normalized.origin;
  const existingSite = await prisma.site.findUnique({
    where: { userId_url: { userId, url: scan.url } },
    select: { id: true },
  });

  if (!existingSite) {
    const existingProject = await prisma.project.findUnique({
      where: { userId_origin: { userId, origin } },
      select: { id: true, _count: { select: { pages: true } } },
    });

    if (!existingProject) {
      const projectCount = await prisma.project.count({ where: { userId } });
      if (projectCount >= limits.maxProjects) {
        redirect(
          `/scan/${scan.id}?limit=project_limit&plan=${userPlan}`,
        );
      }
    } else if (existingProject._count.pages >= limits.maxPagesPerProject) {
      redirect(
        `/scan/${scan.id}?limit=page_limit&plan=${userPlan}`,
      );
    }
  }

  const projectPage = await ensureProjectPageForUrl({ userId, url: scan.url });
  const site = await prisma.site.upsert({
    where: { userId_url: { userId, url: scan.url } },
    create: {
      userId,
      url: scan.url,
      projectId: projectPage?.projectId ?? null,
      pageId: projectPage?.pageId ?? null,
    },
    update: {
      projectId: projectPage?.projectId ?? undefined,
      pageId: projectPage?.pageId ?? undefined,
    },
  });

  await prisma.scan.update({
    where: { id: scan.id },
    data: {
      userId,
      siteId: site.id,
      projectId: projectPage?.projectId ?? null,
      pageId: projectPage?.pageId ?? null,
    },
  });

  redirect(`/scan/${scan.id}?claimed=1`);
}
