const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export function turnstileEnabled(): boolean {
  return Boolean(
    process.env.TURNSTILE_SECRET_KEY &&
      process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
  );
}

export async function verifyTurnstileToken(
  token: string | null | undefined,
  remoteIp: string | null,
): Promise<{ ok: boolean; reason?: string }> {
  if (!turnstileEnabled()) return { ok: true };
  if (!token) return { ok: false, reason: "missing_token" };

  const body = new URLSearchParams();
  body.set("secret", process.env.TURNSTILE_SECRET_KEY!);
  body.set("response", token);
  if (remoteIp) body.set("remoteip", remoteIp);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(SITEVERIFY_URL, {
      method: "POST",
      body,
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return { ok: false, reason: "siteverify_http_error" };
    const data = (await res.json()) as { success: boolean; "error-codes"?: string[] };
    if (data.success) return { ok: true };
    return { ok: false, reason: data["error-codes"]?.join(",") || "siteverify_failed" };
  } catch {
    return { ok: false, reason: "siteverify_network_error" };
  }
}
