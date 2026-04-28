import { prisma } from "@/lib/prisma";
import { normalizeUrl } from "@/lib/scan";
import { ensureDefaultWorkspaceForUser } from "@/lib/workspaces";

export type ProjectPageRef = {
  projectId: string;
  pageId: string;
  workspaceId: string;
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
  const workspace = await ensureDefaultWorkspaceForUser(input.userId);

  const project = await prisma.project.upsert({
    where: {
      userId_origin: {
        userId: input.userId,
        origin,
      },
    },
    create: {
      userId: input.userId,
      workspaceId: workspace.id,
      origin,
      name: host,
    },
    update: {
      workspaceId: workspace.id,
    },
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
    workspaceId: workspace.id,
  };
}
