import Link from "next/link";

type Plan = "FREE" | "STARTER" | "PRO";

interface OnboardingChecklistProps {
  hasScans: boolean;
  hasSite: boolean;
  hasCiToken: boolean;
  plan: Plan;
}

interface Step {
  title: string;
  description: string;
  cta: { href: string; label: string };
  done: boolean;
  chip?: string;
}

function buildSteps({
  hasScans,
  hasSite,
  hasCiToken,
  plan,
}: OnboardingChecklistProps): Step[] {
  const isFree = plan === "FREE";
  return [
    {
      title: "Run your first scan",
      description:
        "Scan any public URL to get an instant accessibility score.",
      cta: { href: "/", label: "Start a scan" },
      done: hasScans,
    },
    {
      title: "Save a page to monitoring",
      description:
        "Turn important pages into ongoing monitoring so regressions surface automatically.",
      cta: { href: "/dashboard", label: "Add a monitored page" },
      done: hasSite,
    },
    {
      title: "Connect your CI pipeline",
      description:
        "Stream scan results from every PR into your dashboard.",
      cta: {
        href: isFree ? "/pricing" : "/dashboard",
        label: isFree ? "Upgrade to connect CI" : "Configure CI ingest",
      },
      done: hasCiToken,
      chip: isFree ? "Pro feature" : undefined,
    },
  ];
}

export function OnboardingChecklist(props: OnboardingChecklistProps) {
  const steps = buildSteps(props);
  const completed = steps.filter((s) => s.done).length;
  const total = steps.length;

  return (
    <div className="rounded-2xl border border-accent/20 bg-accent/5 p-6">
      <details open className="group">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 marker:hidden">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-accent/80">
              Getting started
            </p>
            <h2 className="mt-1 text-lg font-semibold tracking-tight text-text">
              Set up your accessibility workflow
            </h2>
            <p className="mt-1 text-xs text-text-subtle">
              {completed} of {total} steps complete
            </p>
          </div>
          <span
            aria-label="Collapse checklist"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-text-subtle transition-colors group-open:bg-accent/10 group-open:text-accent"
          >
            <span aria-hidden="true" className="text-base leading-none">
              ×
            </span>
          </span>
        </summary>

        <ol className="mt-6 space-y-4">
          {steps.map((step, index) => (
            <li
              key={step.title}
              className="flex items-start gap-4 rounded-xl border border-white/5 bg-bg/40 p-4"
            >
              {step.done ? (
                <span
                  aria-label="Completed"
                  className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-bg"
                >
                  <span aria-hidden="true">✓</span>
                </span>
              ) : (
                <span
                  aria-hidden="true"
                  className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-border text-xs font-medium text-text-subtle"
                >
                  {index + 1}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3
                    className={`text-sm font-semibold ${
                      step.done
                        ? "line-through text-text-subtle"
                        : "text-text"
                    }`}
                  >
                    {step.title}
                  </h3>
                  {step.chip && (
                    <span className="rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-accent">
                      {step.chip}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-text-muted">
                  {step.description}
                </p>
                {!step.done && (
                  <Link
                    href={step.cta.href}
                    className="mt-2 inline-flex text-xs font-medium text-accent hover:underline"
                  >
                    {step.cta.label} →
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ol>
      </details>
    </div>
  );
}
