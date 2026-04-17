import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sendEmail } from "@/lib/email";

export const runtime = "nodejs";

export async function POST() {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const to = session.user.email?.trim();
  if (!to) {
    return NextResponse.json(
      { error: "Your account does not have an email address to send to." },
      { status: 400 },
    );
  }

  const now = new Date();
  const result = await sendEmail({
    to,
    subject: "Accessly test email",
    text: [
      "This is a test email from Accessly.",
      "",
      `Sent at: ${now.toISOString()}`,
      "If you received this, Resend is wired correctly for transactional email.",
    ].join("\n"),
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
        <h1 style="font-size: 18px; margin-bottom: 12px;">Accessly test email</h1>
        <p style="margin: 0 0 12px;">This is a test email from Accessly.</p>
        <p style="margin: 0 0 12px;">Sent at: <code>${now.toISOString()}</code></p>
        <p style="margin: 0;">If you received this, Resend is wired correctly for transactional email.</p>
      </div>
    `,
  });

  if (!result.ok) {
    const status = result.skipped ? 503 : 502;
    return NextResponse.json(
      {
        ok: false,
        error: result.error,
        skipped: result.skipped,
      },
      { status },
    );
  }

  return NextResponse.json({
    ok: true,
    message: `Test email sent to ${to}.`,
    id: result.id,
  });
}
