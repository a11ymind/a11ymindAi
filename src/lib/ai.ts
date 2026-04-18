import Anthropic from "@anthropic-ai/sdk";
import type { Plan } from "@prisma/client";
import type { AxeViolation } from "./scan";

export type AiFix = {
  axeId: string;
  plainEnglishFix: string;
  legalRationale: string;
  codeExample: string;
};

const PAID_MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";
const FREE_MODEL = process.env.ANTHROPIC_FREE_MODEL || "claude-haiku-4-5-20251001";

function modelForPlan(plan: Plan | null): string {
  return plan === "STARTER" || plan === "PRO" ? PAID_MODEL : FREE_MODEL;
}

const SYSTEM_PROMPT = `You are an expert web accessibility consultant advising small-business owners and developers on ADA / WCAG 2.1 compliance.

For every axe-core violation the user provides, produce:
1. plainEnglishFix — 2–3 sentences a non-expert can understand. Say *what* is wrong and *what* to change.
2. legalRationale — 1–2 sentences naming the WCAG success criterion at risk (e.g. "WCAG 2.1 SC 1.1.1 Non-text Content") and the real-world ADA exposure (screen-reader users excluded, Title III demand letters, etc.). Keep it factual, not alarmist.
3. codeExample — a short, concrete HTML/CSS/ARIA snippet showing the fix. Prefer before/after when it clarifies. Wrap in triple backticks with a language tag.

Respond via the report_fixes tool. Preserve the order and axeId of the input.`;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const TOOL = {
  name: "report_fixes",
  description: "Return fix guidance for each accessibility violation.",
  input_schema: {
    type: "object" as const,
    properties: {
      fixes: {
        type: "array",
        items: {
          type: "object",
          properties: {
            axeId: { type: "string" },
            plainEnglishFix: { type: "string" },
            legalRationale: { type: "string" },
            codeExample: { type: "string" },
          },
          required: ["axeId", "plainEnglishFix", "legalRationale", "codeExample"],
        },
      },
    },
    required: ["fixes"],
  },
};

function compactViolations(violations: AxeViolation[]) {
  return violations.map((v) => ({
    axeId: v.id,
    impact: v.impact,
    help: v.help,
    description: v.description,
    helpUrl: v.helpUrl,
    affectedElements: v.nodes.slice(0, 3).map((n) => ({
      html: n.html.slice(0, 400),
      selector: n.target?.join(" ") ?? "",
    })),
  }));
}

export async function generateFixes(
  violations: AxeViolation[],
  plan: Plan | null = null,
): Promise<AiFix[]> {
  if (!process.env.ANTHROPIC_API_KEY) return [];
  if (violations.length === 0) return [];

  const response = await client.messages.create({
    model: modelForPlan(plan),
    max_tokens: 4096,
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    tools: [TOOL],
    tool_choice: { type: "tool", name: "report_fixes" },
    messages: [
      {
        role: "user",
        content: `Here are the violations found on the page. Return fixes in order.\n\n${JSON.stringify(
          compactViolations(violations),
          null,
          2,
        )}`,
      },
    ],
  });

  const toolUse = response.content.find((b) => b.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") return [];
  const input = toolUse.input as { fixes?: AiFix[] };
  return Array.isArray(input.fixes) ? input.fixes : [];
}
