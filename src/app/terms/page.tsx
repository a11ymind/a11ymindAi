import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { LegalLayout } from "@/components/LegalLayout";

export const metadata = {
  title: "Terms of Service — a11ymind AI",
  description:
    "Terms governing your use of the a11ymind AI accessibility scanning service.",
};

export default function TermsPage() {
  return (
    <>
      <SiteHeader variant="minimal" />
      <main id="main" className="min-h-screen">
        <LegalLayout title="Terms of Service" lastUpdated="April 19, 2026">
          <p>
            These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and
            use of <strong>a11ymind AI</strong> (&ldquo;a11ymind&rdquo;, &ldquo;we&rdquo;,
            &ldquo;us&rdquo;). By creating an account or using the Service you agree
            to these Terms. If you do not agree, do not use the Service.
          </p>

          <h2>1. The Service</h2>
          <p>
            a11ymind is an automated web accessibility scanner. It loads a URL you
            provide, runs axe-core rules against the rendered page, scores the
            result, and optionally generates plain-English fix guidance using
            third-party AI models. The Service is a developer tool and a starting
            point for accessibility work; it is <strong>not a substitute for a
            manual audit, legal advice, or a certified accessibility
            professional</strong>.
          </p>

          <h2>2. Accounts</h2>
          <p>
            You must provide accurate information when creating an account and keep
            your credentials secure. You are responsible for activity on your
            account. You must be at least 16 years old to use the Service.
          </p>

          <h2>3. Acceptable use</h2>
          <p>You agree not to:</p>
          <ul>
            <li>
              Scan URLs for which you do not own, control, or have explicit
              permission to scan. Unauthorized scanning of third-party websites
              may violate computer-misuse laws.
            </li>
            <li>Use the Service to attack, overload, or probe any system.</li>
            <li>Attempt to bypass rate limits, abuse detection, or the bot check.</li>
            <li>
              Use automated means to create multiple accounts, or use disposable or
              temporary email providers to evade limits.
            </li>
            <li>
              Resell or white-label the Service without a written agreement with us.
            </li>
            <li>
              Scrape, copy, or repackage the Service&apos;s generated fix guidance as
              your own product.
            </li>
            <li>Violate any applicable law or the rights of any third party.</li>
          </ul>
          <p>
            We may suspend or terminate accounts that violate this section, with or
            without notice.
          </p>

          <h2>4. Plans, billing, and cancellation</h2>
          <p>
            Paid plans are billed monthly in advance via Stripe. Pricing, features,
            and usage limits are shown on our <Link href="/pricing">pricing page</Link>
            {" "}and may change from time to time; changes that materially reduce your
            plan will be communicated before they take effect.
          </p>
          <p>
            You can cancel any time from the billing portal. Cancellation takes
            effect at the end of the current billing period and we do not issue
            pro-rated refunds for partial months. If you believe you were charged
            in error, email <a href="mailto:hello@a11ymind.ai">hello@a11ymind.ai</a>
            {" "}within 30 days of the charge and we will review it in good faith.
          </p>
          <p>
            Failure to pay may result in the account being downgraded to the free
            plan or suspended. Data is preserved for 30 days after downgrade in case
            you restore your subscription.
          </p>

          <h2>5. AI-generated content</h2>
          <p>
            Fix suggestions are produced by a third-party large language model. We
            do not guarantee that the guidance is correct, complete, or suitable
            for your specific site. <strong>Review all suggestions before applying
            them.</strong> You are responsible for the code you ship.
          </p>

          <h2>6. Ownership</h2>
          <p>
            You retain ownership of URLs you scan and any content you submit. We
            retain ownership of the Service, including our scoring heuristic,
            prompts, interface, and aggregate analytics. You grant us a limited
            license to process your submissions solely to operate the Service.
          </p>
          <p>
            Fix suggestions returned to you are provided for your unrestricted use
            in your own projects, subject to section 3.
          </p>

          <h2>7. No legal or compliance advice</h2>
          <p>
            a11ymind reports reference WCAG success criteria and the Americans with
            Disabilities Act for context. This is <strong>not legal advice</strong>.
            Compliance with the ADA, Section 508, AODA, EN 301 549, or any other
            law requires review by qualified counsel and, in most cases, manual
            testing. A passing score does not guarantee compliance; a low score does
            not guarantee non-compliance.
          </p>

          <h2>8. Disclaimers</h2>
          <p>
            THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS
            AVAILABLE&rdquo; WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
            INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
            PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL
            BE UNINTERRUPTED, ERROR-FREE, OR FREE FROM HARMFUL COMPONENTS, OR THAT
            SCAN RESULTS WILL BE COMPLETE OR ACCURATE.
          </p>

          <h2>9. Limitation of liability</h2>
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, a11ymind AND ITS SUPPLIERS WILL
            NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR
            PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED
            DIRECTLY OR INDIRECTLY. OUR TOTAL LIABILITY FOR ANY CLAIM ARISING OUT
            OF OR RELATING TO THE SERVICE IS LIMITED TO THE GREATER OF (A) THE
            AMOUNT YOU PAID US IN THE TWELVE MONTHS PRECEDING THE CLAIM OR (B) USD
            $100.
          </p>

          <h2>10. Indemnification</h2>
          <p>
            You agree to indemnify and hold harmless a11ymind from any claims
            arising out of (a) your use of the Service, (b) your violation of
            these Terms, or (c) your violation of any third-party right, including
            by scanning a URL without authorization.
          </p>

          <h2>11. Termination</h2>
          <p>
            You may stop using the Service and delete your account at any time. We
            may suspend or terminate your access for violation of these Terms, for
            abuse of the Service, or for non-payment. Sections that by their
            nature should survive termination (ownership, disclaimers, liability,
            indemnity) will survive.
          </p>

          <h2>12. Changes</h2>
          <p>
            We may update these Terms. When we do, we will update the &ldquo;Last
            updated&rdquo; date at the top. Material changes will be communicated
            by email or in-app notice at least 14 days before they take effect.
            Continued use after changes take effect constitutes acceptance.
          </p>

          <h2>13. Governing law</h2>
          <p>
            These Terms are governed by the laws of the jurisdiction in which
            a11ymind AI is established, without regard to conflict-of-laws
            principles. Disputes will be resolved in the competent courts of that
            jurisdiction, unless mandatory consumer-protection law in your country
            of residence provides otherwise.
          </p>

          <h2>14. Contact</h2>
          <p>
            Questions about these Terms: <a href="mailto:hello@a11ymind.ai">hello@a11ymind.ai</a>.
          </p>

          <p className="mt-10 text-sm text-text-subtle">
            See also our <Link href="/privacy">Privacy Policy</Link>.
          </p>
        </LegalLayout>
      </main>
    </>
  );
}
