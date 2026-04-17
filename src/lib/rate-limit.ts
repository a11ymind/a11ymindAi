import { isIP } from "node:net";

type Bucket = {
  count: number;
  resetAt: number;
};

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

const DEFAULT_LIMIT = 5;
const DEFAULT_WINDOW_MS = 60 * 60 * 1000;
const CLEANUP_THRESHOLD = 5_000;

const globalRateLimitStore = globalThis as typeof globalThis & {
  accesslyAnonScanBuckets?: Map<string, Bucket>;
};

const buckets =
  globalRateLimitStore.accesslyAnonScanBuckets ??
  new Map<string, Bucket>();

if (!globalRateLimitStore.accesslyAnonScanBuckets) {
  globalRateLimitStore.accesslyAnonScanBuckets = buckets;
}

export function anonymousScanRateLimitConfig() {
  return {
    limit: positiveIntFromEnv("ANON_SCAN_RATE_LIMIT_MAX", DEFAULT_LIMIT),
    windowMs: positiveIntFromEnv(
      "ANON_SCAN_RATE_LIMIT_WINDOW_MS",
      DEFAULT_WINDOW_MS,
    ),
  };
}

export function rateLimitAnonymousScan(req: Request): RateLimitResult {
  const { limit, windowMs } = anonymousScanRateLimitConfig();
  const ip = extractClientIp(req);
  const key = `anon-scan:${ip ?? "unknown"}`;
  const now = Date.now();

  if (buckets.size > CLEANUP_THRESHOLD) {
    cleanupExpiredBuckets(now);
  }

  const existing = buckets.get(key);
  const bucket =
    existing && existing.resetAt > now
      ? existing
      : { count: 0, resetAt: now + windowMs };

  let allowed = false;
  if (bucket.count < limit) {
    bucket.count += 1;
    allowed = true;
  }

  buckets.set(key, bucket);

  return {
    allowed,
    ip,
    key,
    limit,
    remaining: Math.max(0, limit - bucket.count),
    resetAt: bucket.resetAt,
    retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    windowMs,
  };
}

export function extractClientIp(req: Request): string | null {
  // Best-effort for a trusted reverse-proxy deployment such as Vercel.
  // We only read the standard proxy-populated headers we expect here, then
  // accept them only when they parse as concrete IP literals.
  // If the app is deployed without a trusted proxy normalizing these headers,
  // clients may be able to spoof IPs or multiple users may collapse into one
  // "unknown" bucket. That limitation is documented in the README.
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

function cleanupExpiredBuckets(now: number) {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }
}
