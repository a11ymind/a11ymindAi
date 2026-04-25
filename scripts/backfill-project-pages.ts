import { prisma } from "../src/lib/prisma";
import { ensureProjectPageForUrl } from "../src/lib/projects";

async function main() {
  const sites = await prisma.site.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      userId: true,
      url: true,
      projectId: true,
      pageId: true,
    },
  });

  let sitesUpdated = 0;
  let scansUpdated = 0;
  let skippedSites = 0;

  for (const site of sites) {
    const ref = await ensureProjectPageForUrl({
      userId: site.userId,
      url: site.url,
    }).catch((error) => {
      console.error(`[backfill] skipped site ${site.id} (${site.url}):`, error);
      return null;
    });

    if (!ref) {
      skippedSites += 1;
      continue;
    }

    if (site.projectId !== ref.projectId || site.pageId !== ref.pageId) {
      await prisma.site.update({
        where: { id: site.id },
        data: {
          projectId: ref.projectId,
          pageId: ref.pageId,
        },
      });
      sitesUpdated += 1;
    }

    const scanUpdate = await prisma.scan.updateMany({
      where: {
        siteId: site.id,
        OR: [{ projectId: null }, { pageId: null }],
      },
      data: {
        projectId: ref.projectId,
        pageId: ref.pageId,
      },
    });
    scansUpdated += scanUpdate.count;
  }

  const orphanedScans = await prisma.scan.findMany({
    where: {
      siteId: null,
      userId: { not: null },
      OR: [{ projectId: null }, { pageId: null }],
    },
    select: {
      id: true,
      userId: true,
      url: true,
    },
  });

  for (const scan of orphanedScans) {
    const ref = await ensureProjectPageForUrl({
      userId: scan.userId,
      url: scan.url,
    }).catch((error) => {
      console.error(`[backfill] skipped scan ${scan.id} (${scan.url}):`, error);
      return null;
    });

    if (!ref) continue;

    await prisma.scan.update({
      where: { id: scan.id },
      data: {
        projectId: ref.projectId,
        pageId: ref.pageId,
      },
    });
    scansUpdated += 1;
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        sitesSeen: sites.length,
        sitesUpdated,
        scansUpdated,
        skippedSites,
        orphanedScansSeen: orphanedScans.length,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error("[backfill] failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
