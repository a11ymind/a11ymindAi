type HostPolicyInput = {
  requestUrl: URL;
  hostHeader: string | null;
  canonicalAppUrl: string | null;
};

type HostPolicy = {
  redirectTo: URL | null;
  noindex: boolean;
};

export function getHostPolicy(input: HostPolicyInput): HostPolicy {
  const requestHost = normalizeHost(input.hostHeader);
  const canonicalUrl = parseCanonicalUrl(input.canonicalAppUrl);
  const canonicalHost = canonicalUrl ? normalizeHost(canonicalUrl.host) : null;
  const noindex = Boolean(requestHost?.endsWith(".vercel.app"));

  if (!requestHost || !canonicalUrl || !canonicalHost) {
    return { redirectTo: null, noindex };
  }

  if (isLocalHost(requestHost) || requestHost === canonicalHost) {
    return { redirectTo: null, noindex };
  }

  const apexHost = canonicalHost.startsWith("www.")
    ? canonicalHost.slice(4)
    : canonicalHost;
  const shouldRedirect =
    requestHost.endsWith(".vercel.app") || requestHost === apexHost;

  if (!shouldRedirect) {
    return { redirectTo: null, noindex };
  }

  const redirectTo = new URL(input.requestUrl.toString());
  redirectTo.protocol = canonicalUrl.protocol;
  redirectTo.host = canonicalUrl.host;

  return { redirectTo, noindex };
}

function parseCanonicalUrl(value: string | null): URL | null {
  if (!value) return null;
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function normalizeHost(value: string | null): string | null {
  if (!value) return null;
  return value.trim().toLowerCase();
}

function isLocalHost(host: string) {
  return (
    host === "localhost" ||
    host.startsWith("localhost:") ||
    host === "127.0.0.1" ||
    host.startsWith("127.0.0.1:")
  );
}
