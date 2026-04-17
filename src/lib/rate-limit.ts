import { isIP } from "node:net";
import { Prisma, type Plan } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type RateLimitResult = {
  allowed: boolean;
  ip: string | null;
  key: string;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterSec: number;
  windowMs: number;
};

const DEFAULT_ANON_LIMIT = 5;
const DEFAULT_ANON_WINDOW_MS = 60 * 60 * 1000;

// Authenticated scan caps per 24h rolling window, by plan.
const AUTH_SCAN_LIMITS: Record<Plan, number> = {
  FREE: 10,
  STARTER: 50,
  PRO: 500,
};
const AUTH_SCAN_WINDOW_MS = 24 * 60 * 60 * 1000;

export function anonymousScanRateLimitConfig() {
  return {
    limit: positiveIntFromEnv("ANON_SCAN_RATE_LIMIT_MAX", DEFAULT_ANON_LIMIT),
    windowMs: positiveIntFromEnv(
      "ANON_SCAN_RATE_LIMIT_WINDOW_MS",
      DEFAULT_ANON_WINDOW_MS,
    ),
  };
}

export async function rateLimitAnonymousScan(
  req: Request,
): Promise<RateLimitResult> {
  const { limit, windowMs } = anonymousScanRateLimitConfig();
  const ip = extractClientIp(req);
  const key = `anon-scan:${ip ?? "unknown"}`;
  return consumeBucket({ key, limit, windowMs, ip });
}

export async function rateLimitAuthenticatedScan(
  userId: string,
  plan: Plan,
): Promise<RateLimitResult> {
  const limit = AUTH_SCAN_LIMITS[plan];
  const key = `user-scan:${userId}`;
  return consumeBucket({
    key,
    limit,
    windowMs: AUTH_SCAN_WINDOW_MS,
    ip: null,
  });
}

async function consumeBucket(input: {
  key: string;
  limit: number;
  windowMs: number;
  ip: string | null;
}): Promise<RateLimitResult> {
  const { key, limit, windowMs, ip } = input;
  const now = Date.now();
  const windowStart = new Date(now);

  try {
    const result = await prisma.$transaction(
      async (tx) => {
        const existing = await tx.rateLimitBucket.findUnique({ where: { key } });
        const stillInWindow =
          existing && existing.windowStart.getTime() + windowMs > now;

        const bucketWindowStart = stillInWindow
          ? existing.windowStart
          : windowStart;
        const currentCount = stillInWindow ? existing.count : 0;

        if (currentCount >= limit) {
          return {
            allowed: false,
            count: currentCount,
            windowStart: bucketWindowStart,
          };
        }

        await tx.rateLimitBucket.upsert({
          where: { key },
          create: { key, windowStart: bucketWindowStart, count: 1 },
          update: { windowStart: bucketWindowStart, count: currentCount + 1 },
        });

        return {
          allowed: true,
          count: currentCount + 1,
          windowStart: bucketWindowStart,
        };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    const resetAt = result.windowStart.getTime() + windowMs;
    return {
      allowed: result.allowed,
      ip,
      key,
      limit,
      remaining: Math.max(0, limit - result.count),
      resetAt,
      retryAfterSec: Math.max(1, Math.ceil((resetAt - now) / 1000)),
      windowMs,
    };
  } catch (error) {
    // Under serializable conflicts (P2034) or transient DB issues, fail open
    // rather than block legitimate traffic. These are rare and low-impact.
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2034"
    ) {
      return {
        allowed: true,
        ip,
        key,
        limit,
        remaining: limit,
        resetAt: now + windowMs,
        retryAfterSec: 1,
        windowMs,
      };
    }
    throw error;
  }
}

export function extractClientIp(req: Request): string | null {
  const xRealIp = parseIp(req.headers.get("x-real-ip"));
  if (xRealIp) return xRealIp;

  const forwardedFor = req.headers.get("x-forwarded-for");
  if (!forwardedFor) return null;

  const firstHop = forwardedFor.split(",")[0]?.trim() ?? "";
  return parseIp(firstHop);
}

export function rateLimitHeaders(result: RateLimitResult): HeadersInit {
  return {
    "Retry-After": String(result.retryAfterSec),
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
  };
}

function parseIp(value: string | null): string | null {
  if (!value) return null;
  const normalized = value.trim();
  return isIP(normalized) ? normalized : null;
}

function positiveIntFromEnv(name: string, fallback: number): number {
  const value = process.env[name];
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
