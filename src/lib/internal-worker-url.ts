import { isIP } from "node:net";

export function internalWorkerUrl(path: string): string {
  const baseUrl = configuredAppOrigin();
  return new URL(path, baseUrl).toString();
}

function configuredAppOrigin(): string {
  const configured =
    process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? null;

  if (!configured) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("NEXT_PUBLIC_APP_URL or NEXTAUTH_URL is required in production");
    }
    return "http://localhost:3000";
  }

  const parsed = new URL(configured);
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error("Configured app URL must use http or https");
  }
  if (parsed.username || parsed.password) {
    throw new Error("Configured app URL must not include embedded credentials");
  }
  if (process.env.NODE_ENV === "production" && isLocalAppHost(parsed.hostname)) {
    throw new Error("Configured app URL must not point to a local address in production");
  }

  parsed.pathname = "/";
  parsed.search = "";
  parsed.hash = "";
  return parsed.origin;
}

function isLocalAppHost(hostname: string): boolean {
  const normalized = hostname.trim().toLowerCase().replace(/\.$/, "");
  if (
    normalized === "localhost" ||
    normalized.endsWith(".localhost") ||
    normalized.endsWith(".local") ||
    normalized.endsWith(".internal")
  ) {
    return true;
  }

  const ipVersion = isIP(normalized);
  if (ipVersion === 4) {
    const [a, b] = normalized.split(".").map((part) => Number(part));
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168)
    );
  }
  if (ipVersion === 6) {
    return (
      normalized === "::1" ||
      normalized === "::" ||
      normalized.startsWith("fc") ||
      normalized.startsWith("fd") ||
      normalized.startsWith("fe80:")
    );
  }

  return false;
}
