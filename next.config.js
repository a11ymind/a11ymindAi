/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: [
      "puppeteer",
      "puppeteer-core",
      "@sparticuz/chromium",
      "@axe-core/puppeteer",
      "axe-core",
    ],
  },
};

module.exports = nextConfig;
