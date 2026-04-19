import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { entitlementsFor } from "@/lib/entitlements";
import { rateLimitHeaders, rateLimitUserAction } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  token: z.string().trim().min(1).max(255),
  source: z.string().trim().min(1).max(80).default("accesslint"),
  status: z.enum(["passed", "failed"]),
  score: z.number().int().min(0).max(100).optional(),
  criticalCount: z.number().int().min(0).max(10000).default(0),
  seriousCount: z.number().int().min(0).max(10000).default(0),
  moderateCount: z.number().int().min(0).max(10000).default(0),
  minorCount: z.number().int().min(0).max(10000).default(0),
  branch: z.string().trim().max(255).optional(),
  commitSha: z.string().trim().max(80).optional(),
  environment: z.string().trim().max(80).optional(),
  runUrl: z.string().trim().url().max(2000).optional(),
  reportUrl: z.string().trim().url().max(2000).optional(),
});

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid input" },
      { status: 400 },
    );
  }

  // Cap reports per token so a leaked token can't be used to flood the
  // CiCheck table until the user rotates. Real CI pipelines post at most
  // a few times per commit, so 120/hour leaves generous headroom.
  const tokenLimit = await rateLimitUserAction({
    userId: `ci-token:${parsed.data.token}`,
    action: "ci-report",
    limit: 120,
    windowMs: 60 * 60 * 1000,
  });
  if (!tokenLimit.allowed) {
    return NextResponse.json(
      { error: "Too many CI reports for this token in the last hour." },
      { status: 429, headers: rateLimitHeaders(tokenLimit) },
    );
  }

  const site = await prisma.site.findUnique({
    where: { ciIngestToken: parsed.data.token },
    select: {
      id: true,
      user: { select: { plan: true } },
    },
  });
  if (!site) {
    return NextResponse.json({ error: "Invalid CI ingest token" }, { status: 401 });
  }

  if (!entitlementsFor(site.user.plan).ciIntegration) {
    return NextResponse.json(
      { error: "CI check history is available on Pro." },
      { status: 403 },
    );
  }

  const ciCheck = await prisma.ciCheck.create({
    data: {
      siteId: site.id,
      source: parsed.data.source,
      status: parsed.data.status,
      score: parsed.data.score ?? null,
      criticalCount: parsed.data.criticalCount,
      seriousCount: parsed.data.seriousCount,
      moderateCount: parsed.data.moderateCount,
      minorCount: parsed.data.minorCount,
      branch: parsed.data.branch || null,
      commitSha: parsed.data.commitSha || null,
      environment: parsed.data.environment || null,
      runUrl: parsed.data.runUrl || null,
      reportUrl: parsed.data.reportUrl || null,
    },
    select: { id: true, createdAt: true },
  });

  return NextResponse.json({
    ok: true,
    ciCheckId: ciCheck.id,
    createdAt: ciCheck.createdAt.toISOString(),
  });
}
