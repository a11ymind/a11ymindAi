import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { sendAuthWelcomeEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import {
  extractClientIp,
  rateLimitHeaders,
  rateLimitUserAction,
} from "@/lib/rate-limit";

export const runtime = "nodejs";

const Body = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().trim().max(80).optional(),
});

// Disposable-email domains. Not exhaustive — catches the common scripts
// without degrading legitimate signups. Real enterprise-grade detection
// lives behind a paid API; this is a cheap first line.
const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com",
  "10minutemail.com",
  "guerrillamail.com",
  "guerrillamail.net",
  "guerrillamail.org",
  "sharklasers.com",
  "tempmail.com",
  "temp-mail.org",
  "tempmailo.com",
  "yopmail.com",
  "throwawaymail.com",
  "trashmail.com",
  "dispostable.com",
  "getnada.com",
  "maildrop.cc",
  "fakeinbox.com",
  "mintemail.com",
  "spamgourmet.com",
  "mohmal.com",
  "emailondeck.com",
]);

function isDisposableEmail(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return true;
  return DISPOSABLE_DOMAINS.has(domain);
}

export async function POST(req: Request) {
  const ip = extractClientIp(req);
  if (ip) {
    const limit = await rateLimitUserAction({
      userId: `ip:${ip}`,
      action: "signup",
      limit: 5,
      windowMs: 24 * 60 * 60 * 1000,
    });
    if (!limit.allowed) {
      return NextResponse.json(
        {
          error:
            "Too many signups from this network. Try again tomorrow or contact support.",
          retryAfterSec: limit.retryAfterSec,
        },
        { status: 429, headers: rateLimitHeaders(limit) },
      );
    }
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message || "Invalid input";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const email = parsed.data.email.trim().toLowerCase();
  if (isDisposableEmail(email)) {
    return NextResponse.json(
      { error: "Please use a permanent email address." },
      { status: 400 },
    );
  }
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists" },
      { status: 409 },
    );
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name: parsed.data.name || null,
    },
    select: { id: true, email: true, name: true },
  });

  await sendAuthWelcomeEmail({
    to: user.email,
    name: user.name,
    provider: "credentials",
  });

  return NextResponse.json({ ok: true, userId: user.id });
}
