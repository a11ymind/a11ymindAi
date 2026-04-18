# Accessly

An AI-powered ADA/WCAG accessibility compliance tool.

Marketing tagline: *"Know your accessibility risk before a lawsuit does."*

## Getting started

```bash
cp .env.example .env
# fill DATABASE_URL, NEXTAUTH_SECRET, and any optional integrations you want
# (Anthropic, Google OAuth, GitHub OAuth, Resend)
npm install
npx prisma db push
npm run dev
```

See `CLAUDE.md` for the architecture overview and commands reference.

---

## Production readiness

This section is the launch checklist for the current MVP. The app is deployable,
but there are still a few known limitations called out below.

### Exact environment variables

Required in local and production:

```bash
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
NEXT_PUBLIC_APP_URL=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_STARTER_PRICE_ID=
STRIPE_PRO_PRICE_ID=
CRON_SECRET=
```

Optional:

```bash
ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=
RESEND_API_KEY=
RESEND_FROM_EMAIL=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_ID=
GITHUB_SECRET=
ANON_SCAN_RATE_LIMIT_MAX=5
ANON_SCAN_RATE_LIMIT_WINDOW_MS=3600000
```

Notes:

- `NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL` should match your canonical app URL
  in each environment.
- `CRON_SECRET` secures the scheduled auto-scan endpoint. Use a random string of
  at least 16 characters in production.
- Paid checkout is intentionally blocked while
  `STRIPE_STARTER_PRICE_ID` / `STRIPE_PRO_PRICE_ID` still use placeholder
  values.
- Vercel environment variable changes only apply to new deployments, so redeploy
  after changing secrets or price IDs.
- Anonymous scan rate limiting defaults to `5` requests per IP per `3600000`
  ms (1 hour) unless you override the optional env vars above.
- `RESEND_FROM_EMAIL` should be a sender string Resend accepts, such as
  `Accessly <onboarding@resend.dev>` for initial testing or
  `Accessly <hello@yourdomain.com>` after you verify a domain.

### Local setup

```bash
cp .env.example .env
npm install
npx prisma db push
npm run typecheck
npm run build
npm run dev
```

### Launch diagnostics

- Visit `/dashboard/diagnostics` while signed in.
- The page reports whether required env vars are present, whether optional
  integrations are configured, whether Stripe price IDs still look like
  placeholders, and whether `NEXTAUTH_URL` / `NEXT_PUBLIC_APP_URL` look
  aligned.
- It also includes a protected `Send test email` action that sends a Resend test
  email to the signed-in user's own address.
- Secret values are never rendered. The page only shows presence and simple
  deterministic status checks.
- Protection is intentionally lightweight for the current architecture: the
  route sits under `/dashboard/*`, so it is protected by the existing auth
  middleware and a server-side session check.

### Stripe setup

1. Create the Starter and Pro Stripe prices described in the next section.
2. Paste the resulting `price_...` IDs into:
   - `STRIPE_STARTER_PRICE_ID`
   - `STRIPE_PRO_PRICE_ID`
3. Set `STRIPE_SECRET_KEY` with your test key locally, then your live key in
   production.
4. Validate the end-to-end flow from `/pricing` through checkout, redirect, and
   dashboard plan state.

### Resend setup

1. Create a Resend account.
2. Create an API key. Prefer a sending-only key for production use.
3. Add these env vars:

```bash
RESEND_API_KEY=
RESEND_FROM_EMAIL="Accessly <onboarding@resend.dev>"
```

4. For initial testing, you can use Resend's default `resend.dev` sender, but
   it is only suitable for sending to your own email address.
5. Before production rollout, verify a domain in Resend and switch
   `RESEND_FROM_EMAIL` to an address on that verified domain, such as
   `Accessly <hello@yourdomain.com>`.
6. Redeploy after adding or changing email settings.

Notes:

- Once a domain is verified in Resend, you can send from addresses at that
  domain without pre-creating each sender address.
- Resend API keys are shown only once in the dashboard. Store them in env vars
  and do not commit them.
- Accessly now uses this foundation in the authentication flow: new accounts
  receive a welcome email after credentials signup and after first-time social
  account creation.
- If Resend is not configured, Accessly skips sending and logs a useful warning
  instead of crashing request handlers.

### GitHub OAuth setup

1. Open GitHub OAuth Apps at
   https://github.com/settings/developers
2. Create a new OAuth App.
3. Use these production values:
   - Homepage URL: `https://accesslyai.vercel.app`
   - Authorization callback URL:
     `https://accesslyai.vercel.app/api/auth/callback/github`
4. Add these env vars:

```bash
GITHUB_ID=
GITHUB_SECRET=
```

5. Redeploy after adding the credentials.

Notes:

- For local development, the optional callback URL is:
  `http://localhost:3000/api/auth/callback/github`
- GitHub OAuth Apps support a single configured callback URL, unlike GitHub
  Apps. Keep the configured callback aligned with the environment you are
  actively testing, or prioritize the production callback for deployment
  readiness.
- Accessly keeps GitHub sign-in inside the existing NextAuth/Auth.js setup, so
  current billing, checkout resume, scan-claim, and dashboard return flows
  continue to use the same callback URL handling.

### Webhook setup

Local:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Production:

1. Create a Stripe webhook endpoint at
   `https://<your-domain>/api/stripe/webhook`
2. Subscribe to:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
3. Copy the production signing secret into `STRIPE_WEBHOOK_SECRET`
4. Redeploy

### Deployment notes for Vercel

- Accessly uses Next.js App Router and standard Node.js route handlers, which
  Vercel supports out of the box for Next.js deployments.
- Configure all required env vars in the Vercel project before promoting to
  production.
- This repo's `/api/scan` route launches Puppeteer. That means you must verify
  headless Chromium works reliably in your deployed environment before launch.
  This is a repo-specific requirement inferred from the implementation, not a
  guarantee from Vercel.
- If deployed scanning is unreliable, move scanning to a dedicated worker or
  browser service before taking production traffic.
- Scheduled auto-scans are driven by a once-per-day Vercel Cron route at
  `/api/cron/auto-scan`. The route checks which saved sites are due and only
  scans those sites.
- The repo includes a `vercel.json` cron entry for `0 5 * * *` (5:00 UTC
  daily), which fits Vercel Hobby's once-per-day cron limit while still
  supporting weekly and monthly cadences. The weekly/monthly cadence is
  enforced in app logic (`isDueForAutoScan` + `reserveScheduledScan`) rather
  than by multiple cron schedules — the daily run simply filters down to
  sites whose last scan is older than 7 or 30 days depending on plan.
- Vercel Pro is only required if you need either (a) sub-daily cadence
  (e.g. hourly rescans), or (b) multiple distinct cron schedules. The
  current weekly/monthly product tiers do **not** require Pro.

### Scheduled auto-scans

- Free users do not receive scheduled scans.
- Starter users receive a monthly auto-scan for each saved site.
- Pro users receive a weekly auto-scan for each saved site.
- The scheduler runs daily, then computes eligibility from the current saved
  site owner plan plus the latest scan timestamp:
  - Weekly cadence = due after 7 days
  - Monthly cadence = due after 30 days
- Manual rescans count as the latest scan too, so a recent manual run delays
  the next scheduled run for that site instead of creating a duplicate report.
- Scheduled scans are written into the normal `Scan` history, so they appear in
  the same dashboard/history views as manual runs.

##### Email alerts

- After each successful scheduled scan the cron compares the new scan against
  the previous `COMPLETED` scan for that site (set-diff of axe rule IDs).
- An alert email is sent only when there is a meaningful change:
  - at least one **new** issue appeared, or
  - the accessibility **score dropped**
- Alerts go only to Starter and Pro users with an email on file. Free users do
  not receive scheduled alerts.
- Cooldown: the same site will not email more than once per ~23h, tracked via
  `Site.lastAlertSentAt` / `Site.lastAlertScanId`. This is belt-and-braces on
  top of the weekly/monthly cadence gate.
- Send failures are logged and attached to the per-site cron result; they do
  not abort the batch or mark the scan as failed.
- Email content is defined in `sendScheduledScanAlertEmail` in
  `src/lib/email.ts`. The report link uses `NEXT_PUBLIC_APP_URL` (falls back to
  `APP_URL`) + `/scan/<id>`, so set one of those in production.

#### Cron authentication

- The cron route is protected with `CRON_SECRET`.
- Vercel automatically sends `Authorization: Bearer <CRON_SECRET>` when it
  invokes the configured cron path.
- Requests without the expected bearer token are rejected with `401`.

#### Duplicate-run protection

- Before creating a scheduled scan, the route re-checks the site inside a
  serializable transaction.
- If any scan already exists for that site inside the active cadence window,
  the scheduled run is skipped.
- This avoids duplicate scans from overlapping cron invocations in the current
  single-database architecture.

#### Vercel Cron setup

1. Set `CRON_SECRET` in Vercel.
2. Keep the `vercel.json` cron entry committed in this repo, or add the same
   cron path and schedule in the Vercel dashboard.
3. Redeploy after adding the secret or changing the schedule.
4. Confirm the route manually if needed:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  https://<your-domain>/api/cron/auto-scan
```

The route returns a JSON summary with counts for completed, failed, and skipped
sites plus per-site outcomes for logs/operator checks.

### Anonymous scan rate limiting

- Only unauthenticated `POST /api/scan` requests are rate limited.
- The limiter is IP-based and uses a small in-memory fixed window.
- Default threshold: `5` anonymous scans per IP per `1 hour`.
- When the limit is hit, the API returns HTTP `429` plus a user-friendly error
  message and a `Retry-After` header.
- IP extraction is best-effort for a trusted reverse-proxy deployment. The code
  prefers `x-real-ip`, then falls back to the first hop in `x-forwarded-for`,
  and only accepts values that parse as valid IP literals.
- This is intentionally small and production-safe, but not globally
  distributed.

Optional tuning env vars:

```bash
ANON_SCAN_RATE_LIMIT_MAX=5
ANON_SCAN_RATE_LIMIT_WINDOW_MS=3600000
```

Useful Vercel references:

- Environment variables: https://vercel.com/docs/environment-variables
- Node.js runtime: https://vercel.com/docs/functions/runtimes/node-js
- Next.js on Vercel: https://vercel.com/docs/frameworks/nextjs
- Cron jobs: https://vercel.com/docs/cron-jobs

### Known limitations

- PDF export is intentionally minimal and text-first.
- Scheduled auto-scans run inline inside a single cron-triggered function. There
  is no queue or fan-out worker yet, so very large numbers of due sites may
  eventually need batching or background jobs.
- Scheduled scan cadence is best-effort at daily precision. On Vercel Hobby,
  cron timing can drift within the day.
- Scheduled scans reuse the existing scan history model and are not explicitly
  labeled separately from manual scans in the current schema.
- Scheduled-scan email alerts are implemented (Starter + Pro, sent from the
  daily cron when a completed scheduled scan has new issues or a score drop).
  Free users do not receive alerts.
- Resend is wired as a minimal transactional-email foundation. No template
  system or queueing, but welcome emails and scheduled-scan alerts both use it.
- Saved-site quotas are enforced in app logic and still have a theoretical
  concurrent-request race.
- Scan target hardening now blocks obvious private/local targets, but this is
  not a full network-isolation solution.
- Anonymous scan rate limiting is best-effort only. In local development, all
  requests may collapse into one shared bucket if no proxy IP headers are
  present. In multi-instance production, counters are per instance rather than
  globally shared.

### Post-deploy smoke test checklist

1. Visit `/` and run an anonymous scan on a known public URL.
2. Confirm the result page loads, shows violations, and keeps anonymous scans
   public.
3. Create an account from the scan flow and confirm the scan is attached to the
   dashboard.
4. Visit `/pricing` while logged out and confirm paid CTA -> login -> Stripe
   checkout still resumes correctly.
5. Complete a paid checkout in Stripe test mode and confirm `/dashboard?upgraded=1`
   shows the success banner and plan badge updates.
6. Open the billing portal from both the dashboard and pricing flows.
7. Confirm Starter cannot see saved-scan AI fixes or export PDF.
8. Confirm Pro can export a PDF from a saved scan.
9. Cancel or update a subscription in Stripe and confirm the webhook moves the
   user plan back to the expected state.
10. Trigger `/api/cron/auto-scan` with the cron bearer token and confirm
    Starter/Pro sites create a scheduled scan only when due.
11. Run one deployed production scan and verify Puppeteer succeeds in the live
    environment.
12. Visit `/dashboard/diagnostics` while signed in and use `Send test email` to
    confirm Resend delivery.

---

## Setting up Stripe

Accessly uses Stripe Checkout for subscription signup, the Stripe Billing
Portal for cancellations/upgrades, and a webhook to mirror the subscription
state into `User.plan`. The three pricing tiers are defined in
`src/lib/plans.ts`:

| Plan    | Price      | Env var for price ID        |
| ------- | ---------- | --------------------------- |
| Free    | $0         | — (no Stripe product)       |
| Starter | $19/month  | `STRIPE_STARTER_PRICE_ID`   |
| Pro     | $49/month  | `STRIPE_PRO_PRICE_ID`       |

The code ships with **placeholder price IDs** (`price_REPLACE_ME_*`) in
`.env.example`. You must swap them for real Stripe price IDs before paid
checkouts will work — the checkout endpoint refuses to start a session while
the placeholders are in place and will redirect to `/pricing?error=price_not_configured`.

### 1. Get your Stripe API keys

Create a Stripe account, then visit
[dashboard.stripe.com/test/apikeys](https://dashboard.stripe.com/test/apikeys)
and copy:

- **Publishable key** (`pk_test_...`) → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- **Secret key** (`sk_test_...`) → `STRIPE_SECRET_KEY`

Paste both into your `.env`. Keep the secret key out of any client-side code
and out of git.

### 2. Install the Stripe CLI

macOS (Homebrew):

```bash
brew install stripe/stripe-cli/stripe
```

Linux / Windows: see
[stripe.com/docs/stripe-cli](https://stripe.com/docs/stripe-cli#install).

Then log in (this opens your browser):

```bash
stripe login
```

### 3. Create the products and prices

Run these four commands in order. Copy the `price_...` ID printed by each
`prices create` call — you'll paste them into `.env` in the next step.

```bash
# Starter
stripe products create \
  --name "Accessly Starter" \
  --description "1 saved site, monthly auto-scan, email alerts"

stripe prices create \
  --unit-amount 1900 \
  --currency usd \
  -d "recurring[interval]=month" \
  --product <paste_starter_product_id_here>
#  ^ copy the returned `price_...` into STRIPE_STARTER_PRICE_ID

# Pro
stripe products create \
  --name "Accessly Pro" \
  --description "Up to 10 sites, weekly auto-scan, AI fix suggestions, PDF export"

stripe prices create \
  --unit-amount 4900 \
  --currency usd \
  -d "recurring[interval]=month" \
  --product <paste_pro_product_id_here>
#  ^ copy the returned `price_...` into STRIPE_PRO_PRICE_ID
```

> Prefer the dashboard? You can create the same products at
> [dashboard.stripe.com/test/products](https://dashboard.stripe.com/test/products).
> When you add a recurring monthly price, Stripe will show the `price_...` ID
> on the product detail page.

### 4. Paste the price IDs into `.env`

Open `.env` and replace the two placeholder lines:

```diff
- STRIPE_STARTER_PRICE_ID="price_REPLACE_ME_STARTER_19USD_MONTHLY"
- STRIPE_PRO_PRICE_ID="price_REPLACE_ME_PRO_49USD_MONTHLY"
+ STRIPE_STARTER_PRICE_ID="price_1ABCdefXYZ..."
+ STRIPE_PRO_PRICE_ID="price_1XYZ..."
```

Restart `npm run dev` after editing `.env`.

### 5. Forward webhook events to local dev

In a separate terminal, run:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

The CLI will print a signing secret like `whsec_abc123...`. Paste it into
`.env`:

```
STRIPE_WEBHOOK_SECRET="whsec_abc123..."
```

Keep `stripe listen` running while you test. Every event Stripe sends will be
forwarded to your local webhook handler. You can trigger a test event with:

```bash
stripe trigger checkout.session.completed
```

### 6. Test the end-to-end flow

1. Visit `/pricing`, sign up if needed, click **Start Pro**.
2. On the Stripe Checkout page, pay with the test card **4242 4242 4242 4242**
   (any future expiry, any CVC, any ZIP).
3. Stripe redirects to `/dashboard?upgraded=1`. The `PlanBadge` in the header
   should flip to **Pro** within a few seconds (JWT refreshes every 5 min or
   on next sign-in — for immediate reflection, sign out and back in).
4. Click **Manage billing** in the dashboard header to open the Stripe Billing
   Portal. Cancel the subscription — the `customer.subscription.deleted`
   webhook fires and `User.plan` is set back to `FREE`.

### 7. Production setup

1. Switch to live mode in the Stripe dashboard, recreate the two products +
   prices there, and use the live `price_...` IDs in your production env.
2. Create a webhook endpoint at
   [dashboard.stripe.com/webhooks](https://dashboard.stripe.com/webhooks)
   pointing at `https://yourdomain.com/api/stripe/webhook`. Subscribe to:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
3. Copy the signing secret from that endpoint into `STRIPE_WEBHOOK_SECRET` in
   production. **Do not reuse the CLI's `whsec_...` secret** — it's only for
   local forwarding.

### Troubleshooting

- **`/pricing?error=price_not_configured`** — you clicked a paid CTA while
  `STRIPE_STARTER_PRICE_ID` or `STRIPE_PRO_PRICE_ID` still starts with
  `price_REPLACE_ME`. Revisit step 4.
- **Webhook returns 400 "signature verification failed"** — the signing
  secret in `STRIPE_WEBHOOK_SECRET` doesn't match what Stripe used to sign
  the event. Locally, re-run `stripe listen` and copy its new secret.
- **User plan never updates after checkout** — make sure `stripe listen` is
  running, and that `checkout.session.completed` / `customer.subscription.*`
  events are being forwarded.
