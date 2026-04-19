type SlackAlertInput = {
  webhookUrl: string;
  siteUrl: string;
  previousScore: number | null;
  currentScore: number;
  newIssues: number;
  fixedIssues: number;
  reportUrl: string;
};

export function normalizeSlackWebhookUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return null;
  }

  if (parsed.protocol !== "https:") return null;
  if (
    parsed.hostname !== "hooks.slack.com" &&
    parsed.hostname !== "hooks.slack-gov.com"
  ) {
    return null;
  }
  if (!parsed.pathname.startsWith("/services/")) return null;

  return parsed.toString();
}

export async function sendSlackRegressionAlert(
  input: SlackAlertInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const scoreLine =
    input.previousScore !== null
      ? `${input.previousScore} → ${input.currentScore}`
      : `${input.currentScore}`;

  const payload = {
    text: `a11ymind detected accessibility changes on ${input.siteUrl}`,
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "a11ymind accessibility alert",
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text:
            `*Site:* ${input.siteUrl}\n` +
            `*Score:* ${scoreLine}\n` +
            `*New risks:* ${input.newIssues}\n` +
            `*Fixed risks:* ${input.fixedIssues}`,
        },
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "Open report",
            },
            url: input.reportUrl,
          },
        ],
      },
    ],
  };

  try {
    const response = await fetch(input.webhookUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const message = await response.text().catch(() => "");
      return {
        ok: false,
        error: `Slack webhook returned ${response.status}${message ? `: ${message}` : ""}`,
      };
    }

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Slack send failed",
    };
  }
}
