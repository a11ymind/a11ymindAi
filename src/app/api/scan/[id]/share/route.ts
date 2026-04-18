import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function generateToken(): string {
  // 24 bytes → 32 chars base64url — opaque, unguessable.
  return randomBytes(24).toString("base64url");
}

export async function POST(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const scan = await prisma.scan.findUnique({
    where: { id: params.id },
    select: { id: true, userId: true, shareToken: true, status: true },
  });
  if (!scan || scan.userId !== session.user.id) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (scan.status !== "COMPLETED") {
    return NextResponse.json({ error: "scan_not_completed" }, { status: 400 });
  }

  const token = scan.shareToken ?? generateToken();
  if (!scan.shareToken) {
    await prisma.scan.update({
      where: { id: scan.id },
      data: { shareToken: token },
    });
  }

  return NextResponse.json({ token });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const scan = await prisma.scan.findUnique({
    where: { id: params.id },
    select: { id: true, userId: true },
  });
  if (!scan || scan.userId !== session.user.id) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  await prisma.scan.update({
    where: { id: scan.id },
    data: { shareToken: null },
  });

  return NextResponse.json({ ok: true });
}
