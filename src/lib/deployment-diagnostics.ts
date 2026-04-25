import { githubEnabled, googleEnabled } from "@/lib/auth";

type CheckLevel = "pass" | "warn" | "fail";

export type EnvVarDiagnostic = {
  name: string;
  required: boolean;
  present: boolean;
  status: CheckLevel;
  note: string;
};

export type DeploymentDiagnostic = {
  summary: {
    ready: boolean;
    failCount: number;
    warnCount: number;
  };
  requiredEnv: EnvVarDiagnostic[];
  optionalEnv: EnvVarDiagnostic[];
  integrations: {
    stripe: {
      configured: boolean;
      starterPricePlaceholder: boolean;
      proPricePlaceholder: boolean;
    };
    anthropic: {
      configured: boolean;
    };
    resend: {
      configured: boolean;
      fromAddressPresent: boolean;
      partial: boolean;
    };
    googleOAuth: {
      configured: boolean;
      partial: boolean;
    };
    githubOAuth: {
      configured: boolean;
      partial: boolean;
    };
  };
  appUrls: {
    nextAuthUrl: UrlDiagnostic;
    publicAppUrl: UrlDiagnostic;
    originsMatch: boolean;
    httpsRecommended: boolean;
  };
  checks: {
    name: string;
    status: CheckLevel;
    message: string;
  }[];
};

type UrlDiagnostic = {
  present: boolean;
  valid: boolean;
  origin: string | null;
};

const REQUIRED_ENV = [
  "DATABASE_URL",
  "NEXTAUTH_SECRET",
  "NEXTAUTH_URL",
  "NEXT_PUBLIC_APP_URL",
  "CRON_SECRET",
  "SCAN_WORKER_SECRET",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "STRIPE_STARTER_PRICE_ID",
  "STRIPE_PRO_PRICE_ID",
] as const;

const OPTIONAL_ENV = [
  "ANTHROPIC_API_KEY",
  "ANTHROPIC_MODEL",
  "RESEND_API_KEY",
  "RESEND_FROM_EMAIL",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "GITHUB_ID",
  "GITHUB_SECRET",
  "ANON_SCAN_RATE_LIMIT_MAX",
  "ANON_SCAN_RATE_LIMIT_WINDOW_MS",
] as const;

const STRIPE_PLACEHOLDER_PREFIX = "price_REPLACE_ME";

export function getDeploymentDiagnostics(): DeploymentDiagnostic {
  const requiredEnv = REQUIRED_ENV.map((name) => envVarDiagnostic(name, true));
  const optionalEnv = OPTIONAL_ENV.map((name) => envVarDiagnostic(name, false));

  const starterPrice = process.env.STRIPE_STARTER_PRICE_ID ?? "";
  const proPrice = process.env.STRIPE_PRO_PRICE_ID ?? "";
  const starterPricePlaceholder = starterPrice.startsWith(STRIPE_PLACEHOLDER_PREFIX);
  const proPricePlaceholder = proPrice.startsWith(STRIPE_PLACEHOLDER_PREFIX);

  const nextAuthUrl = inspectUrl(process.env.NEXTAUTH_URL);
  const publicAppUrl = inspectUrl(process.env.NEXT_PUBLIC_APP_URL);
  const originsMatch =
    !!nextAuthUrl.origin &&
    !!publicAppUrl.origin &&
    nextAuthUrl.origin === publicAppUrl.origin;
  const httpsRecommended =
    [nextAuthUrl.origin, publicAppUrl.origin]
      .filter((origin): origin is string => Boolean(origin))
      .every((origin) => origin.startsWith("https://"));

  const googleClientId = Boolean(process.env.GOOGLE_CLIENT_ID);
  const googleClientSecret = Boolean(process.env.GOOGLE_CLIENT_SECRET);
  const googlePartial = googleClientId !== googleClientSecret;
  const githubClientId = Boolean(process.env.GITHUB_ID);
  const githubClientSecret = Boolean(process.env.GITHUB_SECRET);
  const githubPartial = githubClientId !== githubClientSecret;

  const checks: DeploymentDiagnostic["checks"] = [
    {
      name: "Required environment variables",
      status: requiredEnv.some((item) => item.status === "fail") ? "fail" : "pass",
      message: requiredEnv.some((item) => item.status === "fail")
        ? "One or more required variables are missing."
        : "All required variables are present.",
    },
    {
      name: "Stripe price IDs",
      status: starterPricePlaceholder || proPricePlaceholder ? "fail" : "pass",
      message: starterPricePlaceholder || proPricePlaceholder
        ? "One or more Stripe price IDs still look like placeholders."
        : "Stripe price IDs do not look like placeholders.",
    },
    {
      name: "Scheduled scan authentication",
      status: process.env.CRON_SECRET ? "pass" : "fail",
      message: process.env.CRON_SECRET
        ? "CRON_SECRET is configured for the auto-scan route."
        : "CRON_SECRET is missing. Scheduled auto-scans cannot be invoked safely.",
    },
    {
      name: "Scan worker authentication",
      status: process.env.SCAN_WORKER_SECRET ? "pass" : "fail",
      message: process.env.SCAN_WORKER_SECRET
        ? "SCAN_WORKER_SECRET is configured for the internal scan worker route."
        : "SCAN_WORKER_SECRET is missing. New scans will rely on the browser fallback instead of server-side worker dispatch.",
    },
    {
      name: "Anthropic integration",
      status: process.env.ANTHROPIC_API_KEY ? "pass" : "warn",
      message: process.env.ANTHROPIC_API_KEY
        ? "Anthropic API key is configured."
        : "Anthropic API key is missing. AI fix generation will stay disabled.",
    },
    {
      name: "Resend integration",
      status:
        process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL
          ? "pass"
          : process.env.RESEND_API_KEY || process.env.RESEND_FROM_EMAIL
            ? "fail"
            : "warn",
      message:
        process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL
          ? "Resend is configured for transactional email."
          : process.env.RESEND_API_KEY || process.env.RESEND_FROM_EMAIL
            ? "Resend is partially configured. Set both API key and from address."
            : "Resend is not configured yet. Email sending stays disabled.",
    },
    {
      name: "Google OAuth integration",
      status: googlePartial ? "fail" : googleEnabled ? "pass" : "warn",
      message: googlePartial
        ? "Google OAuth is partially configured. Set both client ID and client secret."
        : googleEnabled
          ? "Google OAuth is configured."
          : "Google OAuth is not configured. Email/password auth only.",
    },
    {
      name: "GitHub OAuth integration",
      status: githubPartial ? "fail" : githubEnabled ? "pass" : "warn",
      message: githubPartial
        ? "GitHub OAuth is partially configured. Set both client ID and client secret."
        : githubEnabled
          ? "GitHub OAuth is configured."
          : "GitHub OAuth is not configured.",
    },
    {
      name: "App URL consistency",
      status:
        !nextAuthUrl.valid || !publicAppUrl.valid
          ? "fail"
          : originsMatch
            ? httpsRecommended ? "pass" : "warn"
            : "fail",
      message:
        !nextAuthUrl.valid || !publicAppUrl.valid
          ? "NEXTAUTH_URL and NEXT_PUBLIC_APP_URL must both be valid absolute URLs."
          : !originsMatch
            ? "NEXTAUTH_URL and NEXT_PUBLIC_APP_URL do not share the same origin."
            : !httpsRecommended
              ? "URLs match, but HTTPS is recommended before production launch."
              : "NEXTAUTH_URL and NEXT_PUBLIC_APP_URL are aligned.",
    },
  ];

  const failCount = checks.filter((item) => item.status === "fail").length;
  const warnCount = checks.filter((item) => item.status === "warn").length;

  return {
    summary: {
      ready: failCount === 0,
      failCount,
      warnCount,
    },
    requiredEnv,
    optionalEnv,
    integrations: {
      stripe: {
        configured: Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET),
        starterPricePlaceholder,
        proPricePlaceholder,
      },
      anthropic: {
        configured: Boolean(process.env.ANTHROPIC_API_KEY),
      },
      resend: {
        configured: Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL),
        fromAddressPresent: Boolean(process.env.RESEND_FROM_EMAIL),
        partial: Boolean(process.env.RESEND_API_KEY) !== Boolean(process.env.RESEND_FROM_EMAIL),
      },
      googleOAuth: {
        configured: googleEnabled,
        partial: googlePartial,
      },
      githubOAuth: {
        configured: githubEnabled,
        partial: githubPartial,
      },
    },
    appUrls: {
      nextAuthUrl,
      publicAppUrl,
      originsMatch,
      httpsRecommended,
    },
    checks,
  };
}

function envVarDiagnostic(name: string, required: boolean): EnvVarDiagnostic {
  const value = process.env[name];
  const present = Boolean(value);
  const placeholder =
    (name === "STRIPE_STARTER_PRICE_ID" || name === "STRIPE_PRO_PRICE_ID") &&
    Boolean(value?.startsWith(STRIPE_PLACEHOLDER_PREFIX));

  let status: CheckLevel = required ? "fail" : "warn";
  let note = required ? "Missing" : "Not configured";

  if (present) {
    status = placeholder ? "fail" : "pass";
    note = placeholder ? "Present but still a placeholder" : "Present";
  }

  if (
    name === "GOOGLE_CLIENT_ID" ||
    name === "GOOGLE_CLIENT_SECRET" ||
    name === "GITHUB_ID" ||
    name === "GITHUB_SECRET" ||
    name === "RESEND_API_KEY" ||
    name === "RESEND_FROM_EMAIL" ||
    name === "ANON_SCAN_RATE_LIMIT_MAX" ||
    name === "ANON_SCAN_RATE_LIMIT_WINDOW_MS" ||
    name === "ANTHROPIC_MODEL"
  ) {
    status = present ? "pass" : "warn";
  }

  return { name, required, present, status, note };
}

function inspectUrl(value: string | undefined): UrlDiagnostic {
  if (!value) {
    return { present: false, valid: false, origin: null };
  }

  try {
    const parsed = new URL(value);
    return { present: true, valid: true, origin: parsed.origin };
  } catch {
    return { present: true, valid: false, origin: null };
  }
}
