import { NextResponse } from "next/server";
import { entitlementsFor } from "@/lib/entitlements";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BADGE_WIDTH = 244;
const BADGE_HEIGHT = 36;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ siteId: string }> },
) {
  const { siteId } = await params;
  const site = await prisma.site.findUnique({
    where: { id: siteId },
    select: {
      url: true,
      user: {
        select: {
          plan: true,
        },
      },
    },
  });

  const active =
    site !== null && entitlementsFor(site.user.plan).monitoringBadge;

  const svg = renderBadgeSvg({
    hostname: site ? hostOf(site.url) : "site",
    active,
  });

  return new NextResponse(svg, {
    status: 200,
    headers: {
      "content-type": "image/svg+xml; charset=utf-8",
      "cache-control": "public, max-age=300, stale-while-revalidate=3600",
    },
  });
}

function renderBadgeSvg({
  hostname,
  active,
}: {
  hostname: string;
  active: boolean;
}) {
  const background = active ? "#08141a" : "#171717";
  const border = active ? "#17414d" : "#323232";
  const statusDot = active ? "#06b6d4" : "#6b7280";
  const statusText = active ? "Accessibility monitored" : "Monitoring inactive";
  const hostText = active ? hostname : "a11ymind";

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${BADGE_WIDTH}" height="${BADGE_HEIGHT}" viewBox="0 0 ${BADGE_WIDTH} ${BADGE_HEIGHT}" role="img" aria-label="${escapeXml(
    active ? "Accessibility monitored by a11ymind" : "a11ymind monitoring inactive",
  )}">
  <rect x="0.5" y="0.5" width="${BADGE_WIDTH - 1}" height="${BADGE_HEIGHT - 1}" rx="10" fill="${background}" stroke="${border}" />
  <circle cx="18" cy="18" r="5" fill="${statusDot}" />
  <text x="30" y="15" fill="#f8fafc" font-family="Inter, ui-sans-serif, system-ui, sans-serif" font-size="11" font-weight="600">${escapeXml(
    statusText,
  )}</text>
  <text x="30" y="27" fill="#94a3b8" font-family="Inter, ui-sans-serif, system-ui, sans-serif" font-size="10">${escapeXml(
    hostText,
  )}</text>
  <text x="${BADGE_WIDTH - 16}" y="22" text-anchor="end" fill="#06b6d4" font-family="Inter, ui-sans-serif, system-ui, sans-serif" font-size="11" font-weight="700">a11ymind</text>
</svg>`;
}

function hostOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "site";
  }
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
