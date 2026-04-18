import test from "node:test";
import assert from "node:assert/strict";
import {
  anonymousScanRateLimitConfig,
  extractClientIp,
  rateLimitHeaders,
  type RateLimitResult,
} from "../src/lib/rate-limit";

const ORIGINAL_MAX = process.env.ANON_SCAN_RATE_LIMIT_MAX;
const ORIGINAL_WINDOW = process.env.ANON_SCAN_RATE_LIMIT_WINDOW_MS;

test.afterEach(() => {
  if (ORIGINAL_MAX === undefined) {
    delete process.env.ANON_SCAN_RATE_LIMIT_MAX;
  } else {
    process.env.ANON_SCAN_RATE_LIMIT_MAX = ORIGINAL_MAX;
  }

  if (ORIGINAL_WINDOW === undefined) {
    delete process.env.ANON_SCAN_RATE_LIMIT_WINDOW_MS;
  } else {
    process.env.ANON_SCAN_RATE_LIMIT_WINDOW_MS = ORIGINAL_WINDOW;
  }
});

test("anonymousScanRateLimitConfig uses defaults and ignores invalid values", () => {
  delete process.env.ANON_SCAN_RATE_LIMIT_MAX;
  delete process.env.ANON_SCAN_RATE_LIMIT_WINDOW_MS;
  assert.deepEqual(anonymousScanRateLimitConfig(), {
    limit: 5,
    windowMs: 60 * 60 * 1000,
  });

  process.env.ANON_SCAN_RATE_LIMIT_MAX = "0";
  process.env.ANON_SCAN_RATE_LIMIT_WINDOW_MS = "nope";
  assert.deepEqual(anonymousScanRateLimitConfig(), {
    limit: 5,
    windowMs: 60 * 60 * 1000,
  });
});

test("anonymousScanRateLimitConfig accepts positive integer overrides", () => {
  process.env.ANON_SCAN_RATE_LIMIT_MAX = "12";
  process.env.ANON_SCAN_RATE_LIMIT_WINDOW_MS = "60000";

  assert.deepEqual(anonymousScanRateLimitConfig(), {
    limit: 12,
    windowMs: 60000,
  });
});

test("extractClientIp prefers x-real-ip and falls back to first forwarded hop", () => {
  const reqWithRealIp = new Request("http://localhost/api/scan", {
    headers: {
      "x-real-ip": "203.0.113.10",
      "x-forwarded-for": "198.51.100.5, 10.0.0.1",
    },
  });
  assert.equal(extractClientIp(reqWithRealIp), "203.0.113.10");

  const reqForwarded = new Request("http://localhost/api/scan", {
    headers: {
      "x-forwarded-for": "198.51.100.5, 10.0.0.1",
    },
  });
  assert.equal(extractClientIp(reqForwarded), "198.51.100.5");

  const reqInvalid = new Request("http://localhost/api/scan", {
    headers: {
      "x-real-ip": "not-an-ip",
      "x-forwarded-for": "also-not-an-ip",
    },
  });
  assert.equal(extractClientIp(reqInvalid), null);
});

test("rateLimitHeaders exposes retry and limit metadata", () => {
  const result: RateLimitResult = {
    allowed: false,
    ip: "203.0.113.10",
    key: "anon-scan:203.0.113.10",
    limit: 5,
    remaining: 0,
    resetAt: 1710000000000,
    retryAfterSec: 90,
    windowMs: 3600000,
  };

  assert.deepEqual(rateLimitHeaders(result), {
    "Retry-After": "90",
    "X-RateLimit-Limit": "5",
    "X-RateLimit-Remaining": "0",
    "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
  });
});
