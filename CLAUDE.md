# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Product

**Accessly** — an AI-powered ADA / WCAG 2.1 accessibility compliance scanner sold as Micro-SaaS. Target users are small businesses and developers who need an actionable audit without hiring a specialist. Outputs must speak to non-experts (plain-English explanations, legal context, pasteable fixes) while staying precise enough for developers (axe rule IDs, selectors, HTML snippets).

Brand: dark UI (bg `#0f0f0f`, accent `#06b6d4`), Linear/Vercel aesthetic. Tagline: *"Know your accessibility risk before a lawsuit does."*

## Stack

- **Next.js 14.2 (App Router)** — frontend + API routes, all server-rendered/dynamic in the scan path.
- **Tailwind CSS** — theme tokens in `tailwind.config.ts` (`bg`, `border`, `accent`, `text`, `severity.*`). Use those tokens instead of raw hex so the design stays consistent.
- **Prisma + PostgreSQL** — `Scan` and `Violation` tables (see `prisma/schema.prisma`). `Scan.userId` is nullable today; auth lands later.
- **Puppeteer + `@axe-core/puppeteer`** — headless Chromium loads the target URL and runs axe with `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `best-practice` tags.
- **Anthropic SDK (`@anthropic-ai/sdk`)** — Claude generates plain-English fixes. Default model: `claude-sonnet-4-6` (overridable via `ANTHROPIC_MODEL`).

## Commands

```bash
npm run dev          # start Next dev server on :3000
npm run build        # production build (also runs lint + typecheck)
npm run typecheck    # tsc --noEmit only
npm run lint         # next lint
npm run db:push      # push prisma schema to the DATABASE_URL (dev)
npm run db:studio    # prisma studio GUI
```

Before the first run: copy `.env.example` → `.env`, fill `DATABASE_URL` and `ANTHROPIC_API_KEY`, then `npm run db:push`.

## Architecture

The scan flow is the product — everything else supports it.

```
URLScanner (client)
  → POST /api/scan          src/app/api/scan/route.ts
       ├─ normalizeUrl       src/lib/scan.ts
       ├─ scanUrl            src/lib/scan.ts   (Puppeteer + AxePuppeteer)
       ├─ computeScore       src/lib/score.ts  (severity-weighted 0–100)
       ├─ generateFixes      src/lib/ai.ts     (Claude tool-use → AiFix[])
       └─ prisma.$transaction: insert Violations, update Scan
  → redirect /scan/[id]     src/app/scan/[id]/page.tsx  (server component, reads Prisma)
```

Key design choices worth preserving:

- **Anonymous scans are first-class.** `Scan.userId` is optional so the landing-page scanner works without auth. When auth lands, associate the scan post-hoc rather than gating the flow.
- **One Claude call per scan, not per violation.** `generateFixes` batches all violations into a single `report_fixes` tool call with the system prompt marked `cache_control: ephemeral`. Keep it this way — per-violation calls blow up cost and latency.
- **Claude is best-effort.** If `ANTHROPIC_API_KEY` is missing or the call throws, the scan still completes; violation rows just have `null` fix fields. The results page renders a notice instead of failing.
- **Scoring is a single heuristic in one place** (`src/lib/score.ts`: `critical` −8, `serious` −4, `moderate` −2, `minor` −1, floored at 0). If the formula changes, it changes there — don't scatter weights.
- **`/api/scan` is `runtime = "nodejs"` with `maxDuration = 60`.** Puppeteer cannot run on Edge. On Vercel Hobby the 10 s function cap will kill real scans; deploying requires Pro (or swapping to `puppeteer-core` + `@sparticuz/chromium`).
- **Server components do DB reads directly via `@/lib/prisma`.** `/scan/[id]/page.tsx` is async and reads Prisma — don't introduce a client-side fetch layer for pages that are already server-rendered.

## What's not built yet

Auth (NextAuth), Stripe (Free / Starter $19 / Pro $49), the user dashboard, scheduled re-scans, and PDF export are all on the roadmap but not in the codebase. When adding them, keep the anonymous-scan path working — it's the top-of-funnel.
