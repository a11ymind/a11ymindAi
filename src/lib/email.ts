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
