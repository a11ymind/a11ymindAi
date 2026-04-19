import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { LegalLayout } from "@/components/LegalLayout";

export const metadata = {
  title: "Privacy Policy — a11ymind AI",
  description:
    "How a11ymind AI collects, uses, and protects information when you use the accessibility scanner and related services.",
};

export default function PrivacyPage() {
  return (
    <>
      <SiteHeader variant="minimal" />
      <main id="main" className="min-h-screen">
        <LegalLayout title="Privacy Policy" lastUpdated="April 19, 2026">
          <p>
            This Privacy Policy explains how <strong>a11ymind AI</strong> (&ldquo;we&rdquo;,
            &ldquo;us&rdquo;, &ldquo;our&rdquo;) collects and uses information when you
            visit www.a11ymind.ai or use our accessibility scanning services (the
            &ldquo;Service&rdquo;). By using the Service you agree to the practices
            described below.
          </p>

          <h2>1. Information we collect</h2>
          <h3>Account information</h3>
          <p>
            When you create an account we collect your email address, a hashed
            password (for credential sign-ups), and optional display name. If you sign
            in with Google or GitHub, we receive your email and basic profile fields
            from that provider.
          </p>
          <h3>Scan data</h3>
          <p>
            When you run a scan we receive and store the target URL, the accessibility
            violations detected on that page, axe rule identifiers, the HTML snippets
            of affected elements, and the resulting score. This data is associated
            with your account when you are logged in; anonymous scans are stored
            without an owner and are eligible for deletion after 30 days.
          </p>
          <h3>Billing information</h3>
          <p>
            We do <strong>not</strong> see or store payment card details. Payments are
            processed by <a href="https://stripe.com/privacy">Stripe</a>, which
            returns a customer ID and subscription metadata that we store to manage
            your plan.
          </p>
          <h3>Technical data</h3>
          <p>
            Our infrastructure logs standard request data (IP address, user agent,
            timestamp, path) for abuse prevention and debugging. These logs are
            retained for up to 30 days.
          </p>

          <h2>2. How we use information</h2>
          <ul>
            <li>To operate the Service — run scans, store results, show your dashboard.</li>
            <li>To generate plain-English fix guidance via our AI provider (see §3).</li>
            <li>To send transactional email (sign-in confirmations, scan alerts, billing notices).</li>
            <li>To prevent abuse — rate limiting, bot detection, and disposable-email checks.</li>
            <li>To improve the Service in aggregate — we do not train AI models on your scan data.</li>
          </ul>

          <h2>3. Third-party services</h2>
          <p>
            We share the minimum data necessary with the following processors:
          </p>
          <ul>
            <li>
              <strong>Anthropic</strong> — violation data is sent to Anthropic&apos;s
              Claude API to generate fix guidance. Anthropic processes the request
              and returns a response; per their commercial terms they do not use
              API inputs to train models.
            </li>
            <li>
              <strong>Stripe</strong> — payment processing and subscription
              management.
            </li>
            <li>
              <strong>Resend</strong> — transactional email delivery.
            </li>
            <li>
              <strong>Vercel</strong> — application hosting and serverless execution.
            </li>
            <li>
              <strong>Cloudflare Turnstile</strong> — bot protection on the signup
              form. Turnstile may process your IP address and browser characteristics
              to produce a risk score.
            </li>
            <li>
              <strong>Google / GitHub</strong> — only if you choose the respective OAuth sign-in.
            </li>
          </ul>

          <h2>4. Cookies</h2>
          <p>
            We set a session cookie to keep you signed in. We do not use advertising
            or cross-site tracking cookies. Cloudflare Turnstile and our OAuth
            providers may set their own cookies as part of their flows.
          </p>

          <h2>5. Data retention</h2>
          <ul>
            <li>Account and scan data: retained while your account is active.</li>
            <li>Anonymous scan results: up to 30 days.</li>
            <li>Server logs: up to 30 days.</li>
            <li>Billing records: retained as long as required by tax and accounting law.</li>
          </ul>

          <h2>6. Your rights</h2>
          <p>
            You can export or delete your account data at any time by emailing
            <a href="mailto:hello@a11ymind.ai"> hello@a11ymind.ai</a>. Account
            deletion removes your user record, saved sites, scans, and share
            tokens. Billing records may be retained where required by law.
          </p>
          <p>
            If you are in the EU, UK, or California you have rights under GDPR / UK
            GDPR / CCPA including access, correction, erasure, and portability. Send
            requests to the address above and we will respond within the statutory
            timeframe.
          </p>

          <h2>7. Security</h2>
          <p>
            Passwords are stored hashed with bcrypt. Traffic to the Service is
            served over HTTPS. We use the standard access controls provided by our
            hosting and database providers. No system is perfectly secure — if you
            discover a vulnerability please report it to
            <a href="mailto:security@a11ymind.ai"> security@a11ymind.ai</a>.
          </p>

          <h2>8. Children</h2>
          <p>
            The Service is not directed to children under 16 and we do not
            knowingly collect their information.
          </p>

          <h2>9. Changes to this policy</h2>
          <p>
            We may update this policy. When we do, we will change the &ldquo;Last
            updated&rdquo; date at the top. Material changes will be announced by
            email or an in-app notice before they take effect.
          </p>

          <h2>10. Contact</h2>
          <p>
            Questions or requests: <a href="mailto:hello@a11ymind.ai">hello@a11ymind.ai</a>.
          </p>

          <p className="mt-10 text-sm text-text-subtle">
            See also our <Link href="/terms">Terms of Service</Link>.
          </p>
        </LegalLayout>
      </main>
    </>
  );
}
