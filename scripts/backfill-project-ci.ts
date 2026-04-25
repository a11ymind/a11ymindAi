import { prisma } from "../src/lib/prisma";

async function main() {
  const sites = await prisma.site.findMany({
    where: { projectId: { not: null } },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      projectId: true,
      ciIngestToken: true,
    },
  });

  let projectsUpdated = 0;
  let checksUpdated = 0;
  const seenProjects = new Set<string>();

  for (const site of sites) {
    if (!site.projectId) continue;

    if (!seenProjects.has(site.projectId)) {
      await prisma.project.update({
        where: { id: site.projectId },
        data: { ciIngestToken: site.ciIngestToken },
      });
      seenProjects.add(site.projectId);
      projectsUpdated += 1;
    }

    const updated = await prisma.ciCheck.updateMany({
      where: {
        siteId: site.id,
        projectId: null,
      },
      data: { projectId: site.projectId },
    });
    checksUpdated += updated.count;
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        sitesSeen: sites.length,
        projectsUpdated,
        checksUpdated,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error("[backfill:project-ci] failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
