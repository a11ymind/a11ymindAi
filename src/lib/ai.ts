import Anthropic from "@anthropic-ai/sdk";
import type { Plan } from "@prisma/client";
import { z } from "zod";
import type { AxeViolation } from "./scan";

export type AiFix = {
  axeId: string;
  legalRationale: string;
  plainEnglishFix: string;
  codeExample: string;
  verificationSteps: string[];
  acceptanceCriteria: string[];
  developerTicket: string;
  confidence: "low" | "medium" | "high";
};

const PAID_MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5-20250929";
const FREE_MODEL = process.env.ANTHROPIC_FREE_MODEL || "claude-haiku-4-5-20251001";

function modelForPlan(plan: Plan | null): string {
  return plan === "STARTER" || plan === "PRO" ? PAID_MODEL : FREE_MODEL;
}

const SYSTEM_PROMPT = `You are an expert web accessibility remediation consultant.

For every axe-core violation the user provides, return practical guidance that a product owner can understand and a developer can execute.

For each fix:
- Keep legalRationale factual, not alarmist. Name the likely WCAG criterion when possible.
- plainEnglishFix must say exactly what to change in plain language.
- codeExample must be concrete and based on the supplied selector/HTML. Prefer before/after snippets when useful. Use fenced code blocks.
- verificationSteps must explain how to confirm the issue is fixed after deployment.
- acceptanceCriteria must be copyable into a developer ticket.
- developerTicket must be a concise ticket body.
- confidence should be high only when the selector/HTML gives enough evidence.

Respond via the report_fixes tool. Preserve the axeId values from the input. Do not invent axeIds.`;

let cachedClient: Anthropic | null = null;

function getClient(): Anthropic | null {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  if (!cachedClient) {
    cachedClient = new Anthropic({ apiKey });
  }
  return cachedClient;
}

const stringField = { type: "string", maxLength: 4000 } as const;
const stringArrayField = {
  type: "array",
  items: { type: "string", maxLength: 1000 },
  minItems: 1,
  maxItems: 5,
} as const;

const TOOL = {
  name: "report_fixes",
  description: "Return actionable remediation guidance for accessibility violations.",
  input_schema: {
    type: "object" as const,
    properties: {
      fixes: {
        type: "array",
        items: {
          type: "object",
          properties: {
            axeId: { type: "string" },
            legalRationale: stringField,
            plainEnglishFix: stringField,
            codeExample: stringField,
            verificationSteps: stringArrayField,
            acceptanceCriteria: stringArrayField,
            developerTicket: stringField,
            confidence: { type: "string", enum: ["low", "medium", "high"] },
          },
          required: [
            "axeId",
            "legalRationale",
            "plainEnglishFix",
            "codeExample",
            "verificationSteps",
            "acceptanceCriteria",
            "developerTicket",
            "confidence",
          ],
        },
      },
    },
    required: ["fixes"],
  },
};

const FixSchema = z.object({
  axeId: z.string().min(1).max(200),
  legalRationale: z.string().min(1).max(4000),
  plainEnglishFix: z.string().min(1).max(4000),
  codeExample: z.string().min(1).max(6000),
  verificationSteps: z.array(z.string().min(1).max(1000)).min(1).max(5),
  acceptanceCriteria: z.array(z.string().min(1).max(1000)).min(1).max(5),
  developerTicket: z.string().min(1).max(4000),
  confidence: z.enum(["low", "medium", "high"]),
});

const ToolInputSchema = z.object({
  fixes: z.array(FixSchema),
});

const MAX_VIOLATIONS_SENT = 30;
const MAX_NODES_PER_VIOLATION = 3;
const MAX_HTML_CHARS = 500;
const AI_CALL_TIMEOUT_MS = 30_000;
const RETRY_DELAYS_MS = [500, 1500];

const IMPACT_RANK: Record<string, number> = {
  critical: 0,
  serious: 1,
  moderate: 2,
  minor: 3,
};

function compactViolations(violations: AxeViolation[]) {
  const ranked = [...violations].sort(
    (a, b) => (IMPACT_RANK[a.impact ?? "minor"] ?? 4) - (IMPACT_RANK[b.impact ?? "minor"] ?? 4),
  );
  return ranked.slice(0, MAX_VIOLATIONS_SENT).map((v) => ({
    axeId: v.id,
    impact: v.impact,
    help: v.help,
    description: v.description,
    helpUrl: v.helpUrl,
    affectedElements: v.nodes.slice(0, MAX_NODES_PER_VIOLATION).map((n) => ({
      html: n.html.slice(0, MAX_HTML_CHARS),
      selector: n.target?.join(" ") ?? "",
      failureSummary: n.failureSummary?.slice(0, 800) ?? "",
    })),
  }));
}

function isRetryableAnthropicError(error: unknown): boolean {
  if (error instanceof Error && error.name === "AbortError") return true;
  const status = typeof error === "object" && error && "status" in error
    ? Number((error as { status?: unknown }).status)
    : null;
  return status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function createMessageWithTimeout(
  client: Anthropic,
  inputViolations: ReturnType<typeof compactViolations>,
  plan: Plan | null,
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AI_CALL_TIMEOUT_MS);
  const started = Date.now();
  try {
    const response = await client.messages.create(
      {
        model: modelForPlan(plan),
        max_tokens: 6000,
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
            content: `Return remediation guidance for these axe-core violations as structured tool output.\n\n${JSON.stringify(
              inputViolations,
              null,
              2,
            )}`,
          },
        ],
      },
      { signal: controller.signal },
    );
    console.info(
      `[ai] Anthropic ${modelForPlan(plan)} completed in ${Date.now() - started}ms` +
        ` input=${response.usage.input_tokens} output=${response.usage.output_tokens}`,
    );
    return response;
  } finally {
    clearTimeout(timeout);
  }
}

export async function generateFixes(
  violations: AxeViolation[],
  plan: Plan | null = null,
): Promise<AiFix[]> {
  const client = getClient();
  if (!client) return [];
  if (violations.length === 0) return [];

  const inputViolations = compactViolations(violations);
  const allowedAxeIds = new Set(inputViolations.map((violation) => violation.axeId));
  let lastError: unknown = null;

  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt += 1) {
    try {
      const response = await createMessageWithTimeout(client, inputViolations, plan);
      const toolUse = response.content.find((block) => block.type === "tool_use");
      if (!toolUse || toolUse.type !== "tool_use") return [];

      const parsed = ToolInputSchema.safeParse(toolUse.input);
      if (!parsed.success) {
        console.warn("[ai] invalid Anthropic tool output", parsed.error.flatten());
        return [];
      }

      const seen = new Set<string>();
      return parsed.data.fixes.filter((fix) => {
        if (!allowedAxeIds.has(fix.axeId) || seen.has(fix.axeId)) return false;
        seen.add(fix.axeId);
        return true;
      });
    } catch (error) {
      lastError = error;
      if (!isRetryableAnthropicError(error) || attempt === RETRY_DELAYS_MS.length) {
        throw error;
      }
      await sleep(RETRY_DELAYS_MS[attempt]);
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Anthropic request failed");
}
