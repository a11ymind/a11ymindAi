import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { entitlementsFor } from "@/lib/entitlements";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ siteId: string }> },
) {
  const { siteId } = await params;
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const site = await prisma.site.findUnique({
    where: { id: siteId },
    select: {
      id: true,
      userId: true,
      user: { select: { plan: true } },
    },
  });
  if (!site || site.userId !== session.user.id) {
    return NextResponse.json({ error: "Site not found" }, { status: 404 });
  }

  if (!entitlementsFor(site.user.plan).ciIntegration) {
    return NextResponse.json(
      { error: "CI integration is available on Pro." },
      { status: 403 },
    );
  }

  const token = randomBytes(24).toString("base64url");

  await prisma.site.update({
    where: { id: site.id },
    data: { ciIngestToken: token },
  });

  return NextResponse.json({ ok: true, token });
}
