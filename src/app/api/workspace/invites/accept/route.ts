import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session?.user?.id || !session.user.email) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", new URL(req.url).pathname + new URL(req.url).search);
    return NextResponse.redirect(loginUrl);
  }

  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "missing_token" }, { status: 400 });
  }

  const invite = await prisma.workspaceInvite.findUnique({
    where: { token },
    select: {
      id: true,
      workspaceId: true,
      email: true,
      role: true,
      status: true,
      expiresAt: true,
    },
  });

  if (!invite || invite.status !== "PENDING" || invite.expiresAt < new Date()) {
    return NextResponse.json({ error: "invite_expired" }, { status: 410 });
  }

  if (invite.email.toLowerCase() !== session.user.email.toLowerCase()) {
    return NextResponse.json({ error: "wrong_account" }, { status: 403 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.workspaceMember.upsert({
      where: {
        workspaceId_userId: {
          workspaceId: invite.workspaceId,
          userId: session.user.id,
        },
      },
      create: {
        workspaceId: invite.workspaceId,
        userId: session.user.id,
        role: invite.role,
      },
      update: {
        role: invite.role,
      },
    });
    await tx.workspaceInvite.update({
      where: { id: invite.id },
      data: {
        status: "ACCEPTED",
        acceptedAt: new Date(),
      },
    });
  });

  return NextResponse.redirect(new URL("/dashboard", req.url));
}
