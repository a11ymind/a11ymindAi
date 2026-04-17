import type { Plan } from "@prisma/client";

const STYLES: Record<Plan, string> = {
  FREE: "border-border bg-bg-muted text-text-muted",
  STARTER: "border-accent-muted bg-accent-muted/20 text-accent",
  PRO: "border-accent bg-accent/20 text-accent",
};

const LABELS: Record<Plan, string> = {
  FREE: "Free",
  STARTER: "Starter",
  PRO: "Pro",
};

export function PlanBadge({ plan }: { plan: Plan }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${STYLES[plan]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {LABELS[plan]}
    </span>
  );
}
