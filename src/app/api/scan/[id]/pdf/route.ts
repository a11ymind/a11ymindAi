import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { entitlementsFor } from "@/lib/entitlements";
import { renderScanPdf } from "@/lib/pdf";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.redirect(
      new URL(`/login?callbackUrl=${encodeURIComponent(`/scan/${id}`)}`, _req.url),
    );
  }

  const scan = await prisma.scan.findUnique({
    where: { id },
    include: {
      user: {
        select: { plan: true },
      },
      violations: {
        select: {
          axeId: true,
          impact: true,
          help: true,
          description: true,
          selector: true,
          legalRationale: true,
          plainEnglishFix: true,
          codeExample: true,
          aiDetails: true,
        },
      },
    },
  });

  if (!scan || scan.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (scan.status !== "COMPLETED") {
    return redirectToScan(id, "failed", _req.url);
  }

  const entitlements = entitlementsFor(scan.user?.plan ?? "FREE");
  if (!entitlements.pdfExport) {
    return redirectToScan(id, "pro_required", _req.url);
  }

  try {
    const comparison = buildPdfComparison(
      scan,
      await findPreviousComparableScan({
        id: scan.id,
        createdAt: scan.createdAt,
        pageId: scan.pageId,
        siteId: scan.siteId,
        userId: scan.userId,
        url: scan.url,
      }),
    );

    const pdf = renderScanPdf(scan, { comparison });
    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `attachment; filename="${reportFilename(scan.url, scan.createdAt)}"`,
        "cache-control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("[scan/pdf] failed:", error);
    return redirectToScan(id, "failed", _req.url);
  }
}

function redirectToScan(scanId: string, code: string, requestUrl: string) {
  const url = new URL(`/scan/${scanId}`, requestUrl);
  url.searchParams.set("pdf", code);
  return NextResponse.redirect(url, { status: 303 });
}

function reportFilename(url: string, createdAt: Date): string {
  const stamp = createdAt.toISOString().slice(0, 10);
  const host = hostFromUrl(url).replace(/[^a-z0-9.-]/gi, "-");
  return `a11ymind-${host}-${stamp}.pdf`;
}

function hostFromUrl(url: string): string {
  try {
    return new URL(url).hostname || "report";
  } catch {
    return "report";
  }
}

async function findPreviousComparableScan(scan: {
  id: string;
  createdAt: Date;
  pageId: string | null;
  siteId: string | null;
  userId: string | null;
  url: string;
}) {
  const select = {
    score: true,
    createdAt: true,
    violations: { select: { axeId: true } },
  } as const;

  if (scan.pageId) {
    return prisma.scan.findFirst({
      where: {
        pageId: scan.pageId,
        status: "COMPLETED",
        createdAt: { lt: scan.createdAt },
        id: { not: scan.id },
      },
      orderBy: { createdAt: "desc" },
      select,
    });
  }

  if (scan.siteId) {
    return prisma.scan.findFirst({
      where: {
        siteId: scan.siteId,
        status: "COMPLETED",
        createdAt: { lt: scan.createdAt },
        id: { not: scan.id },
      },
      orderBy: { createdAt: "desc" },
      select,
    });
  }

  if (scan.userId) {
    return prisma.scan.findFirst({
      where: {
        userId: scan.userId,
        url: scan.url,
        status: "COMPLETED",
        createdAt: { lt: scan.createdAt },
        id: { not: scan.id },
      },
      orderBy: { createdAt: "desc" },
      select,
    });
  }

  return null;
}

function buildPdfComparison(
  current: {
    score: number;
    violations: { axeId: string }[];
  },
  previous:
    | {
        score: number;
        createdAt: Date;
        violations: { axeId: string }[];
      }
    | null,
) {
  if (!previous) {
    return null;
  }

  const currentIssues = new Set(current.violations.map((violation) => violation.axeId));
  const previousIssues = new Set(previous.violations.map((violation) => violation.axeId));
  let newRisks = 0;
  let fixedRisks = 0;

  for (const axeId of currentIssues) {
    if (!previousIssues.has(axeId)) newRisks += 1;
  }

  for (const axeId of previousIssues) {
    if (!currentIssues.has(axeId)) fixedRisks += 1;
  }

  return {
    delta: current.score - previous.score,
    newRisks,
    fixedRisks,
  };
}
