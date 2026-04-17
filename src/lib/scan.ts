import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import puppeteer from "puppeteer";
import { AxePuppeteer } from "@axe-core/puppeteer";

export type AxeNode = {
  html: string;
  target: string[];
  failureSummary?: string;
};

export type AxeViolation = {
  id: string;
  impact: "critical" | "serious" | "moderate" | "minor" | null;
  description: string;
  help: string;
  helpUrl: string;
  tags: string[];
  nodes: AxeNode[];
};

export type ScanResult = {
  url: string;
  finalUrl: string;
  violations: AxeViolation[];
  passes: number;
  incomplete: number;
  inapplicable: number;
};

export function normalizeUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) throw new Error("URL is required");
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  const parsed = new URL(withScheme);
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Only http and https URLs are supported");
  }
  if (parsed.username || parsed.password) {
    throw new Error("URLs with embedded credentials are not supported");
  }
  if (isBlockedHostname(parsed.hostname)) {
    throw new Error("That URL points to a private or local address and cannot be scanned");
  }
  return parsed.toString();
}

export async function scanUrl(url: string): Promise<ScanResult> {
  const target = normalizeUrl(url);
  const parsedTarget = new URL(target);
  await assertPublicHostname(parsedTarget.hostname);
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
    ],
  });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });
    await page.setUserAgent(
      "Mozilla/5.0 (compatible; AccesslyBot/1.0; +https://accessly.app)",
    );
    const response = await page.goto(target, {
      waitUntil: "networkidle2",
      timeout: 45_000,
    });
    if (!response || !response.ok()) {
      throw new Error(
        `Target returned ${response?.status() ?? "no response"}. Cannot scan.`,
      );
    }

    const results = await new AxePuppeteer(page)
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"])
      .analyze();

    return {
      url: target,
      finalUrl: page.url(),
      violations: results.violations as AxeViolation[],
      passes: results.passes.length,
      incomplete: results.incomplete.length,
      inapplicable: results.inapplicable.length,
    };
  } finally {
    await browser.close();
  }
}

async function assertPublicHostname(hostname: string) {
  if (isBlockedHostname(hostname)) {
    throw new Error("That URL points to a private or local address and cannot be scanned");
  }

  const addresses = await lookup(hostname, { all: true, verbatim: true }).catch(() => []);
  if (
    addresses.length > 0 &&
    addresses.some((entry) => isBlockedIp(entry.address))
  ) {
    throw new Error("That URL resolves to a private or local address and cannot be scanned");
  }
}

function isBlockedHostname(hostname: string): boolean {
  const normalized = hostname.trim().toLowerCase().replace(/\.$/, "");
  if (!normalized) return true;
  if (
    normalized === "localhost" ||
    normalized === "0.0.0.0" ||
    normalized.endsWith(".localhost") ||
    normalized.endsWith(".local") ||
    normalized.endsWith(".internal")
  ) {
    return true;
  }
  return isBlockedIp(normalized);
}

function isBlockedIp(value: string): boolean {
  const ipVersion = isIP(value);
  if (ipVersion === 4) return isBlockedIpv4(value);
  if (ipVersion === 6) return isBlockedIpv6(value);
  return false;
}

function isBlockedIpv4(value: string): boolean {
  const octets = value.split(".").map((part) => Number(part));
  if (octets.length !== 4 || octets.some((part) => Number.isNaN(part))) return false;

  const [a, b] = octets;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168)
  );
}

function isBlockedIpv6(value: string): boolean {
  const normalized = value.toLowerCase();
  return (
    normalized === "::1" ||
    normalized === "::" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe80:")
  );
}
