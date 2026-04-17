import { Resend } from "resend";

type SendEmailInput = {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
};

export type SendEmailResult =
  | { ok: true; id: string | null }
  | { ok: false; skipped: boolean; error: string };

const resendClient = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

function configuredFromAddress(): string | null {
  const from = process.env.RESEND_FROM_EMAIL?.trim();
  return from ? from : null;
}

export function emailConfigured(): boolean {
  return Boolean(resendClient && configuredFromAddress());
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  if (!resendClient || !configuredFromAddress()) {
    const missing: string[] = [];
    if (!process.env.RESEND_API_KEY) missing.push("RESEND_API_KEY");
    if (!configuredFromAddress()) missing.push("RESEND_FROM_EMAIL");

    const error = `Email sending skipped because ${missing.join(" and ")} ${missing.length === 1 ? "is" : "are"} not configured.`;
    console.warn(`[email] ${error}`);
    return { ok: false, skipped: true, error };
  }

  if (!input.text && !input.html) {
    const error = "Email sending skipped because no text or html body was provided.";
    console.error(`[email] ${error}`);
    return { ok: false, skipped: false, error };
  }

  try {
    const base = {
      from: configuredFromAddress()!,
      to: input.to,
      subject: input.subject,
    };
    const payload =
      input.html && input.text
        ? { ...base, html: input.html, text: input.text }
        : input.html
          ? { ...base, html: input.html }
          : { ...base, text: input.text! };

    const response = await resendClient.emails.send(payload);

    if (response.error) {
      console.error("[email] Resend API error", response.error);
      return {
        ok: false,
        skipped: false,
        error: response.error.message || "Resend rejected the email request.",
      };
    }

    return { ok: true, id: response.data?.id ?? null };
  } catch (error) {
    console.error("[email] Unexpected send failure", error);
    return {
      ok: false,
      skipped: false,
      error: error instanceof Error ? error.message : "Unexpected email failure",
    };
  }
}

export async function sendAuthWelcomeEmail(input: {
  to: string;
  name?: string | null;
  provider: "credentials" | "google";
}): Promise<SendEmailResult> {
  const greeting = input.name?.trim() ? `Hi ${input.name.trim()},` : "Hi,";
  const providerLine =
    input.provider === "google"
      ? "Your Accessly account is ready and linked to your Google sign-in."
      : "Your Accessly account is ready and you can now sign in with your email and password.";

  const text = [
    greeting,
    "",
    "Welcome to Accessly.",
    providerLine,
    "",
    "You can now:",
    "- run accessibility scans",
    "- save monitored websites",
    "- track regressions over time from your dashboard",
  ].join("\n");

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
      <h1 style="font-size: 18px; margin-bottom: 12px;">Welcome to Accessly</h1>
      <p style="margin: 0 0 12px;">${escapeHtml(greeting)}</p>
      <p style="margin: 0 0 12px;">${escapeHtml(providerLine)}</p>
      <p style="margin: 0 0 12px;">You can now:</p>
      <ul style="margin: 0; padding-left: 18px;">
        <li>run accessibility scans</li>
        <li>save monitored websites</li>
        <li>track regressions over time from your dashboard</li>
      </ul>
    </div>
  `;

  return sendEmail({
    to: input.to,
    subject: "Welcome to Accessly",
    text,
    html,
  });
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
