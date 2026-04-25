import { after, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { discoverSameOriginPages } from "@/lib/page-discovery";
import { createScanRecord } from "@/lib/scan-jobs";
import { entitlementsFor } from "@/lib/entitlements";
import { ensureProjectPageForUrl } from "@/lib/projects";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(
  req: Request,
  { params }: { params: Promise<{ siteId: string }> },
) {
  const { siteId } = await params;
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [site, user] = await Promise.all([
    prisma.site.findUnique({
      where: { id: siteId },
      select: {
        id: true,
        url: true,
        userId: true,
        projectId: true,
      },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { plan: true },
    }),
  ]);

  if (!site || site.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const plan = user?.plan ?? "FREE";
  const entitlements = entitlementsFor(plan);
  if (plan === "FREE") {
    return NextResponse.json(
      { error: "upgrade_required", message: "Multi-page discovery is available on Starter and Pro." },
      { status: 402 },
    );
  }

  let projectId = site.projectId;
  if (!projectId) {
    const origin = new URL(site.url).origin;
    const existingProject = await prisma.project.findUnique({
      where: { userId_origin: { userId: session.user.id, origin } },
      select: { id: true },
    });
    projectId = existingProject?.id ?? null;

    if (!projectId) {
      const projectCount = await prisma.project.count({
        where: { userId: session.user.id },
      });
      if (projectCount >= entitlements.maxProjects) {
        return NextResponse.json(
          {
            error: "project_limit",
            message: "You've reached the website limit on your current plan.",
          },
          { status: 409 },
        );
      }
    }
  }

  const projectPage = await ensureProjectPageForUrl({
    userId: session.user.id,
    url: site.url,
  });
  if (projectPage) {
    projectId = projectPage.projectId;
    await prisma.site.updateMany({
      where: { id: site.id, userId: session.user.id },
      data: {
        projectId: projectPage.projectId,
        pageId: projectPage.pageId,
      },
    });
  }

  const currentPageCount = projectId
    ? await prisma.page.count({ where: { projectId } })
    : 0;
  const remainingPageSlots = Math.max(
    0,
    entitlements.maxPagesPerProject - currentPageCount,
  );
  const discoveryLimit = entitlements.maxPagesPerProject;
  const discovered = await discoverSameOriginPages({
    siteUrl: site.url,
    limit: discoveryLimit,
  });
  const existingSites = await prisma.site.findMany({
    where: {
      userId: session.user.id,
      url: { in: discovered.map((page) => page.url) },
    },
    select: { id: true, url: true, projectId: true, pageId: true },
  });
  const siteByUrl = new Map(existingSites.map((existing) => [existing.url, existing]));

  const createdScans: { scanId: string; url: string; siteId: string }[] = [];
  let createdSites = 0;
  let createdPages = 0;
  let skippedForLimit = 0;
  let skippedInFlight = 0;

  for (const page of discovered) {
    let targetSite = siteByUrl.get(page.url);
    let pageRef: { projectId: string; pageId: string } | null = null;
    if (targetSite) {
      if (!targetSite.pageId && createdPages >= remainingPageSlots) {
        skippedForLimit += 1;
        continue;
      }
      pageRef = await ensureProjectPageForUrl({
        userId: session.user.id,
        url: page.url,
      });
      if (!targetSite.pageId) createdPages += 1;
    }

    if (!targetSite) {
      if (createdPages >= remainingPageSlots) {
        skippedForLimit += 1;
        continue;
      }
      pageRef = await ensureProjectPageForUrl({
        userId: session.user.id,
        url: page.url,
      });
      const created = await prisma.site.create({
        data: {
          userId: session.user.id,
          url: page.url,
          projectId: pageRef?.projectId ?? null,
          pageId: pageRef?.pageId ?? null,
        },
        select: { id: true, url: true, projectId: true, pageId: true },
      });
      createdSites += 1;
      createdPages += 1;
      targetSite = created;
      siteByUrl.set(page.url, created);
    }

    const inFlight = await prisma.scan.findFirst({
      where: {
        siteId: targetSite.id,
        status: { in: ["PENDING", "RUNNING"] },
      },
      select: { id: true },
    });
    if (inFlight) {
      skippedInFlight += 1;
      continue;
    }

    if (pageRef) {
      await prisma.site.updateMany({
        where: { id: targetSite.id, userId: session.user.id },
        data: {
          projectId: pageRef.projectId,
          pageId: pageRef.pageId,
        },
      });
    }

    const scan = await createScanRecord({
      url: page.url,
      userId: session.user.id,
      siteId: targetSite.id,
      projectId: pageRef?.projectId ?? null,
      pageId: pageRef?.pageId ?? null,
    });
    createdScans.push({ scanId: scan.id, url: page.url, siteId: targetSite.id });
    enqueueScanWorker(scan.id, req.url);
  }

  return NextResponse.json({
    ok: true,
    discovered: discovered.length,
    createdSites,
    createdPages,
    createdScans: createdScans.length,
    skippedForLimit,
    skippedInFlight,
    scans: createdScans,
  });
}

function enqueueScanWorker(scanId: string, requestUrl: string) {
  const secret = process.env.SCAN_WORKER_SECRET;
  if (!secret) return;

  const baseUrl = workerBaseUrl(requestUrl);
  after(async () => {
    try {
      const res = await fetch(`${baseUrl}/api/internal/scan-worker`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${secret}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({ scanId }),
        cache: "no-store",
      });
      if (!res.ok) {
        console.error(`[site/crawl] worker returned ${res.status} for ${scanId}`);
      }
    } catch (error) {
      console.error(`[site/crawl] failed to enqueue worker for ${scanId}:`, error);
    }
  });
}

function workerBaseUrl(requestUrl: string) {
  const configured =
    process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? null;
  if (configured) return configured.replace(/\/$/, "");
  return new URL(requestUrl).origin;
}
