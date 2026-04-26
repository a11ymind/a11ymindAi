import { assertPublicHostname, normalizeUrl } from "@/lib/scan";

const DEFAULT_DISCOVERY_LIMIT = 10;

export type DiscoveredPage = {
  url: string;
  source: "sitemap" | "link";
};

export async function discoverSameOriginPages(input: {
  siteUrl: string;
  limit?: number;
}): Promise<DiscoveredPage[]> {
  const limit = Math.max(1, Math.min(input.limit ?? DEFAULT_DISCOVERY_LIMIT, 50));
  const root = normalizeUrl(input.siteUrl);
  const rootUrl = new URL(root);
  await assertPublicHostname(rootUrl.hostname);
  const origin = rootUrl.origin;
  const discovered = new Map<string, DiscoveredPage>();

  for (const page of await discoverFromSitemap(origin, limit)) {
    addPage(discovered, page, origin, limit);
  }

  if (discovered.size < limit) {
    for (const page of await discoverFromLinks(root, limit - discovered.size)) {
      addPage(discovered, page, origin, limit);
    }
  }

  addPage(discovered, { url: root, source: "link" }, origin, limit);

  return [...discovered.values()].slice(0, limit);
}

async function discoverFromSitemap(
  origin: string,
  limit: number,
): Promise<DiscoveredPage[]> {
  await assertPublicHostname(new URL(origin).hostname);
  const sitemapUrl = `${origin}/sitemap.xml`;
  const res = await fetch(sitemapUrl, {
    headers: { "user-agent": "a11ymindBot/1.0 (+https://www.a11ymind.ai)" },
    signal: AbortSignal.timeout(10_000),
  }).catch(() => null);

  if (!res?.ok) return [];
  const xml = await res.text();
  return extractSitemapUrls(xml)
    .slice(0, limit)
    .map((url) => ({ url, source: "sitemap" as const }));
}

async function discoverFromLinks(
  rootUrl: string,
  limit: number,
): Promise<DiscoveredPage[]> {
  await assertPublicHostname(new URL(rootUrl).hostname);
  const res = await fetch(rootUrl, {
    headers: { "user-agent": "a11ymindBot/1.0 (+https://www.a11ymind.ai)" },
    signal: AbortSignal.timeout(10_000),
  }).catch(() => null);

  if (!res?.ok) return [];
  const html = await res.text();
  return extractHtmlLinks(html, rootUrl)
    .slice(0, limit)
    .map((url) => ({ url, source: "link" as const }));
}

export function extractSitemapUrls(xml: string): string[] {
  const urls: string[] = [];
  const locPattern = /<loc>\s*([^<]+?)\s*<\/loc>/gi;
  let match: RegExpExecArray | null;
  while ((match = locPattern.exec(xml)) !== null) {
    urls.push(decodeXmlEntities(match[1]?.trim() ?? ""));
  }
  return urls;
}

export function extractHtmlLinks(html: string, baseUrl: string): string[] {
  const urls: string[] = [];
  const hrefPattern = /\bhref\s*=\s*["']([^"']+)["']/gi;
  let match: RegExpExecArray | null;
  while ((match = hrefPattern.exec(html)) !== null) {
    const href = match[1]?.trim();
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
      continue;
    }
    try {
      urls.push(new URL(href, baseUrl).toString());
    } catch {
      // Ignore malformed links.
    }
  }
  return urls;
}

function addPage(
  pages: Map<string, DiscoveredPage>,
  page: DiscoveredPage,
  origin: string,
  limit: number,
) {
  if (pages.size >= limit) return;
  let normalized: string;
  try {
    normalized = normalizeUrl(page.url);
  } catch {
    return;
  }
  if (new URL(normalized).origin !== origin) return;
  if (!pages.has(normalized)) {
    pages.set(normalized, { url: normalized, source: page.source });
  }
}

function decodeXmlEntities(value: string): string {
  return value.replaceAll("&amp;", "&");
}
