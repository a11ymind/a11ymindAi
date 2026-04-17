/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: [
      "puppeteer",
      "puppeteer-core",
      "@sparticuz/chromium",
      "@axe-core/puppeteer",
    ],
  },
};

module.exports = nextConfig;
