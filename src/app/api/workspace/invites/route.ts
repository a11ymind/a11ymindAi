import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { entitlementsFor } from "@/lib/entitlements";
import {
  canManageWorkspace,
  createInviteToken,
  ensureDefaultWorkspaceForUser,
  getWorkspaceMembership,
} from "@/lib/workspaces";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  email: z.string().trim().email(),
  role: z.enum(["ADMIN", "MEMBER", "VIEWER"]).default("MEMBER"),
});

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = Body.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_invite" }, { status: 400 });
  }

  const workspace = await ensureDefaultWorkspaceForUser(session.user.id);
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true },
  });
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const entitlements = entitlementsFor(user.plan);
  if (!entitlements.teamMembers) {
    return NextResponse.json({ error: "upgrade_required" }, { status: 402 });
  }

  const membership = await getWorkspaceMembership(session.user.id, workspace.id);
  if (!membership || !canManageWorkspace(membership.role)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const memberCount = await prisma.workspaceMember.count({
    where: { workspaceId: workspace.id },
  });
  const pendingInviteCount = await prisma.workspaceInvite.count({
    where: { workspaceId: workspace.id, status: "PENDING" },
  });
  if (memberCount + pendingInviteCount >= entitlements.maxWorkspaceMembers) {
    return NextResponse.json({ error: "member_limit_reached" }, { status: 402 });
  }

  const email = parsed.data.email.toLowerCase();
  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (existingUser) {
    const existingMember = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: workspace.id,
          userId: existingUser.id,
        },
      },
    });
    if (existingMember) {
      return NextResponse.json({ error: "already_member" }, { status: 409 });
    }
  }

  const invite = await prisma.workspaceInvite.create({
    data: {
      workspaceId: workspace.id,
      email,
      role: parsed.data.role,
      token: createInviteToken(),
      invitedById: session.user.id,
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
    select: {
      id: true,
      email: true,
      role: true,
      token: true,
      expiresAt: true,
    },
  });

  return NextResponse.json({
    invite,
    acceptUrl: `/api/workspace/invites/accept?token=${invite.token}`,
  }, { status: 201 });
}
