import { prisma } from "@/lib/prisma";
import { normalizeUrl } from "@/lib/scan";

export type ProjectPageRef = {
  projectId: string;
  pageId: string;
};

export async function ensureProjectPageForUrl(input: {
  userId: string | null;
  url: string;
}): Promise<ProjectPageRef | null> {
  if (!input.userId) return null;

  const normalizedUrl = normalizeUrl(input.url);
  const parsed = new URL(normalizedUrl);
  const origin = parsed.origin;
  const host = parsed.hostname.replace(/^www\./, "");

  const project = await prisma.project.upsert({
    where: {
      userId_origin: {
        userId: input.userId,
        origin,
      },
    },
    create: {
      userId: input.userId,
      origin,
      name: host,
    },
    update: {},
    select: { id: true },
  });

  const page = await prisma.page.upsert({
    where: {
      projectId_url: {
        projectId: project.id,
        url: normalizedUrl,
      },
    },
    create: {
      projectId: project.id,
      url: normalizedUrl,
    },
    update: {},
    select: { id: true },
  });

  return {
    projectId: project.id,
    pageId: page.id,
  };
}
