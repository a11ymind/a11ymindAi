/** @type {import('next').NextConfig} */

// Origins the browser is allowed to connect to (fetch, XHR, SSE, WS).
// NextAuth's intermediate OAuth pages ship a restrictive default CSP that
// blocks same-origin fetch calls made by the next-auth client library
// (e.g. /api/auth/csrf, /api/auth/signin/*). Declaring our own enforcement
// header here takes precedence and restores the connections OAuth needs.
const CSP_CONNECT_SRC = [
  "'self'",
  // Turnstile challenge API
  "https://challenges.cloudflare.com",
  // Sentry error ingestion (only active when Sentry env vars are set)
  "https://*.ingest.sentry.io",
].join(" ");

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // next/script and inline Next.js bootstrap require unsafe-inline for now
      "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com",
      "style-src 'self' 'unsafe-inline'",
      // User avatars from OAuth providers come from any https origin
      "img-src 'self' data: https:",
      "font-src 'self'",
      `connect-src ${CSP_CONNECT_SRC}`,
      // Turnstile renders inside an iframe
      "frame-src https://challenges.cloudflare.com",
      "object-src 'none'",
      "base-uri 'self'",
    ].join("; "),
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: __dirname,
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
  serverExternalPackages: [
    "puppeteer",
    "puppeteer-core",
    "@sparticuz/chromium",
    "@axe-core/puppeteer",
    "axe-core",
  ],
  // Include the @sparticuz/chromium binary files (.br) in Vercel's output
  // bundle. Without this, Vercel excludes non-JS assets from node_modules
  // and the bin/ directory is missing at runtime, causing executablePath()
  // to throw or fall back to a remote download.
  outputFileTracingIncludes: {
    "/api/internal/scan-worker": [
      "./node_modules/@sparticuz/chromium/bin/**",
    ],
    "/api/scan": [
      "./node_modules/@sparticuz/chromium/bin/**",
    ],
    "/api/cron/auto-scan": [
      "./node_modules/@sparticuz/chromium/bin/**",
    ],
  },
};

const hasSentryCreds =
  Boolean(process.env.SENTRY_ORG) &&
  Boolean(process.env.SENTRY_PROJECT) &&
  Boolean(process.env.SENTRY_AUTH_TOKEN);

if (hasSentryCreds) {
  // Only wrap when build-time source-map upload creds are present.
  // Without them, withSentryConfig would print warnings on every build.
  const { withSentryConfig } = require("@sentry/nextjs");
  module.exports = withSentryConfig(nextConfig, {
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
    authToken: process.env.SENTRY_AUTH_TOKEN,
    silent: true,
    hideSourceMaps: true,
    disableLogger: true,
  });
} else {
  module.exports = nextConfig;
}
