import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimitHeaders, rateLimitUserAction } from "@/lib/rate-limit";
import { entitlementsFor } from "@/lib/entitlements";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SHARE_MINT_LIMIT = 30;
const SHARE_MINT_WINDOW_MS = 60 * 60 * 1000;

function generateToken(): string {
  // 24 bytes → 32 chars base64url — opaque, unguessable.
  return randomBytes(24).toString("base64url");
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true },
  });
  if (!user || !entitlementsFor(user.plan).shareableLink) {
    return NextResponse.json(
      {
        error: "upgrade_required",
        message: "Shareable links are included on Starter and Pro. Upgrade to enable sharing.",
      },
      { status: 402 },
    );
  }

  const limit = await rateLimitUserAction({
    userId: session.user.id,
    action: "share-mint",
    limit: SHARE_MINT_LIMIT,
    windowMs: SHARE_MINT_WINDOW_MS,
  });
  if (!limit.allowed) {
    return NextResponse.json(
      {
        error: "rate_limited",
        message:
          "You're creating share links too quickly. Try again in a little bit.",
        retryAfterSec: limit.retryAfterSec,
      },
      { status: 429, headers: rateLimitHeaders(limit) },
    );
  }

  const scan = await prisma.scan.findUnique({
    where: { id },
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
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const scan = await prisma.scan.findUnique({
    where: { id },
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
