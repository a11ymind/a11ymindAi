# Accessly

An AI-powered ADA/WCAG accessibility compliance tool.

Marketing tagline: *"Know your accessibility risk before a lawsuit does."*

## Getting started

```bash
cp .env.example .env
# fill DATABASE_URL, ANTHROPIC_API_KEY, NEXTAUTH_SECRET, and (optionally)
# GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET
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
```

Optional:

```bash
ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
ANON_SCAN_RATE_LIMIT_MAX=5
ANON_SCAN_RATE_LIMIT_WINDOW_MS=3600000
```

Notes:

- `NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL` should match your canonical app URL
  in each environment.
- Paid checkout is intentionally blocked while
  `STRIPE_STARTER_PRICE_ID` / `STRIPE_PRO_PRICE_ID` still use placeholder
  values.
- Vercel environment variable changes only apply to new deployments, so redeploy
  after changing secrets or price IDs.
- Anonymous scan rate limiting defaults to `5` requests per IP per `3600000`
  ms (1 hour) unless you override the optional env vars above.

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
- Auto-scan scheduling is not implemented yet, so no Vercel Cron Job setup is
  required for the current MVP.

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
- Auto-scan scheduling and email alerts are not implemented yet.
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
10. Run one deployed production scan and verify Puppeteer succeeds in the live
    environment.

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
