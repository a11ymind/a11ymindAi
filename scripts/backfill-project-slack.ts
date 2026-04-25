import { prisma } from "../src/lib/prisma";

async function main() {
  const sites = await prisma.site.findMany({
    where: {
      projectId: { not: null },
      slackWebhookUrl: { not: null },
    },
    select: {
      id: true,
      projectId: true,
      slackWebhookUrl: true,
    },
  });

  let projectsUpdated = 0;
  const seenProjects = new Set<string>();

  for (const site of sites) {
    if (!site.projectId || !site.slackWebhookUrl || seenProjects.has(site.projectId)) {
      continue;
    }

    await prisma.project.update({
      where: { id: site.projectId },
      data: { slackWebhookUrl: site.slackWebhookUrl },
    });
    seenProjects.add(site.projectId);
    projectsUpdated += 1;
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        sitesSeen: sites.length,
        projectsUpdated,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error("[backfill:project-slack] failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
