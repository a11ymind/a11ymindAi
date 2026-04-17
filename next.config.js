/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["puppeteer", "@axe-core/puppeteer"],
  },
};

module.exports = nextConfig;
