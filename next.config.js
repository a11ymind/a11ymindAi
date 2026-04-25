/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: __dirname,
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
