import test from "node:test";
import assert from "node:assert/strict";
import { extractHtmlLinks, extractSitemapUrls } from "../src/lib/page-discovery";

test("extractSitemapUrls reads loc entries and decodes XML entities", () => {
  const urls = extractSitemapUrls(`
    <urlset>
      <url><loc>https://example.com/</loc></url>
      <url><loc>https://example.com/pricing?a=1&amp;b=2</loc></url>
    </urlset>
  `);

  assert.deepEqual(urls, [
    "https://example.com/",
    "https://example.com/pricing?a=1&b=2",
  ]);
});

test("extractHtmlLinks resolves relative links and skips non-page protocols", () => {
  const urls = extractHtmlLinks(
    `
      <a href="/pricing">Pricing</a>
      <a href='https://example.com/about'>About</a>
      <a href="#main">Skip</a>
      <a href="mailto:test@example.com">Email</a>
      <a href="tel:+123">Phone</a>
    `,
    "https://example.com/",
  );

  assert.deepEqual(urls, [
    "https://example.com/pricing",
    "https://example.com/about",
  ]);
});
