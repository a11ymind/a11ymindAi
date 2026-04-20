import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendScanReportEmail } from "@/lib/email";
import {
  extractClientIp,
  rateLimitUserAction,
  rateLimitHeaders,
} from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  email: z.string().trim().email().max(254),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Enter a valid email address." },
      { status: 400 },
    );
  }

  const email = parsed.data.email.toLowerCase();

  // Abuse guard: cap emails-per-IP per day. Without this a bot could
  // harvest the scan report endpoint to spam arbitrary recipients.
  const clientIp = extractClientIp(req);
  if (clientIp) {
    const ipLimit = await rateLimitUserAction({
      userId: `ip:${clientIp}`,
      action: "scan-email-ip",
      limit: 10,
      windowMs: 24 * 60 * 60 * 1000,
    });
    if (!ipLimit.allowed) {
      return NextResponse.json(
        { error: "Too many emails from this network today. Try again later." },
        { status: 429, headers: rateLimitHeaders(ipLimit) },
      );
    }
  }

  // Abuse guard: cap emails-per-recipient per day, in case the IP limit
  // gets circumvented (VPN, shared office). Prevents using us to harass
  // a single inbox.
  const recipientLimit = await rateLimitUserAction({
    userId: `email:${email}`,
    action: "scan-email-recipient",
    limit: 5,
    windowMs: 24 * 60 * 60 * 1000,
  });
  if (!recipientLimit.allowed) {
    return NextResponse.json(
      { error: "This address has already been emailed several reports today." },
      { status: 429, headers: rateLimitHeaders(recipientLimit) },
    );
  }

  const scan = await prisma.scan.findUnique({
    where: { id },
    select: {
      id: true,
      url: true,
      score: true,
      status: true,
      violations: { select: { impact: true } },
    },
  });
  if (!scan) {
    return NextResponse.json({ error: "Scan not found" }, { status: 404 });
  }
  if (scan.status !== "COMPLETED") {
    return NextResponse.json(
      { error: "This scan isn't ready yet." },
      { status: 409 },
    );
  }

  const criticalCount = scan.violations.filter((v) => v.impact === "critical").length;
  const seriousCount = scan.violations.filter((v) => v.impact === "serious").length;

  const baseUrl = (
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXTAUTH_URL ??
    ""
  ).replace(/\/$/, "");
  const reportUrl = `${baseUrl}/scan/${scan.id}`;

  const result = await sendScanReportEmail({
    to: email,
    scannedUrl: scan.url,
    score: scan.score,
    reportUrl,
    criticalCount,
    seriousCount,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: "We couldn't send the email right now. Please try again." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
