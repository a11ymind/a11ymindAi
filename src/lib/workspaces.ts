import { randomBytes } from "node:crypto";
import type { Prisma, WorkspaceRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type DbClient = typeof prisma | Prisma.TransactionClient;

export async function ensureDefaultWorkspaceForUser(
  userId: string,
  db: DbClient = prisma,
): Promise<{ id: string; name: string }> {
  const existing = await db.workspaceMember.findFirst({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: {
      workspace: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
  if (existing?.workspace) return existing.workspace;

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true },
  });
  const workspaceName = workspaceNameForUser(user?.name, user?.email);

  const workspace = await db.workspace.create({
    data: {
      name: workspaceName,
      members: {
        create: {
          userId,
          role: "OWNER",
        },
      },
    },
    select: { id: true, name: true },
  });

  await Promise.all([
    db.project.updateMany({
      where: { userId, workspaceId: null },
      data: { workspaceId: workspace.id },
    }),
    db.site.updateMany({
      where: { userId, workspaceId: null },
      data: { workspaceId: workspace.id },
    }),
    db.scan.updateMany({
      where: { userId, workspaceId: null },
      data: { workspaceId: workspace.id },
    }),
  ]);

  return workspace;
}

export async function getWorkspaceMembership(userId: string, workspaceId: string) {
  return prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId,
        userId,
      },
    },
    select: {
      id: true,
      role: true,
      workspace: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
}

export function canManageWorkspace(role: WorkspaceRole): boolean {
  return role === "OWNER" || role === "ADMIN";
}

export async function canAccessWorkspaceResource(input: {
  userId: string;
  ownerUserId: string | null;
  workspaceId: string | null;
}): Promise<boolean> {
  if (input.ownerUserId === input.userId) return true;
  if (!input.workspaceId) return false;
  const membership = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId: input.workspaceId,
        userId: input.userId,
      },
    },
    select: { id: true },
  });
  return Boolean(membership);
}

export function createInviteToken(): string {
  return randomBytes(32).toString("base64url");
}

function workspaceNameForUser(name: string | null | undefined, email: string | null | undefined) {
  if (name?.trim()) return `${name.trim()}'s workspace`;
  const localPart = email?.split("@")[0]?.trim();
  return localPart ? `${localPart}'s workspace` : "My workspace";
}
