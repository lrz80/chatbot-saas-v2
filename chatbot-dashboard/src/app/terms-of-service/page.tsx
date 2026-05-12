'use client';

import type React from 'react';
import { BriefcaseIcon } from 'lucide-react';

const UPDATED_AT = '2026-05-11';

type TosSection = {
  title: string;
  body: React.ReactNode;
};

const TOS_SECTIONS: TosSection[] = [
  {
    title: '1. Introduction',
    body: (
      <>
        Aamy.ai provides AI-powered voice automation services for businesses, including AI voice receptionist functionality,
        inbound call handling, conversational automation, appointment assistance, SMS follow-up when enabled, and related
        business communication tools. By subscribing to or using Aamy.ai, you agree to these Terms of Service.
      </>
    ),
  },
  {
    title: '2. Aamy Voice Pro Subscription',
    body: (
      <>
        Aamy Voice Pro is offered as a twelve (12) month service commitment billed monthly at $250 USD per month through
        automatic recurring payments. The service is intended for business use only.
      </>
    ),
  },
  {
    title: '3. Annual Service Commitment',
    body: (
      <>
        By subscribing to Aamy Voice Pro, you agree to an initial twelve (12) month term beginning on the date your
        subscription starts. Monthly billing does not convert the subscription into a month-to-month agreement during the
        initial term.
      </>
    ),
  },
  {
    title: '4. Thirty-Day Cancellation Period',
    body: (
      <>
        You may cancel your subscription within the first thirty (30) calendar days from the subscription start date without
        further obligation under the annual commitment. After the first thirty (30) days, the annual commitment becomes
        binding for the remainder of the initial term.
      </>
    ),
  },
  {
    title: '5. Early Termination Fee',
    body: (
      <>
        If you cancel after the initial thirty (30) day cancellation period and before the end of the twelve (12) month
        initial term, you agree to pay an early termination fee equal to three (3) monthly subscription payments.
      </>
    ),
  },
  {
    title: '6. Automatic Billing Authorization',
    body: (
      <>
        You authorize Aamy.ai and its payment processor to automatically charge your selected payment method on a recurring
        monthly basis for the subscription fee and any applicable charges. You are responsible for keeping a valid payment
        method on file.
      </>
    ),
  },
  {
    title: '7. Failed Payments and Suspension',
    body: (
      <>
        If a payment fails, Aamy.ai may suspend or restrict access to the service until payment is successfully collected.
        Continued failure to pay may result in termination of service and collection of any outstanding amounts owed under
        the agreement.
      </>
    ),
  },
  {
    title: '8. No Setup Fee',
    body: (
      <>
        Aamy Voice Pro does not include a separate setup fee. Any configuration, onboarding, or implementation work provided
        by Aamy.ai is included as part of the subscription and is subject to the annual service commitment described in these
        Terms.
      </>
    ),
  },
  {
    title: '9. Service Scope',
    body: (
      <>
        Aamy.ai may provide AI voice call handling, business information responses, appointment-related assistance,
        multilingual conversational support, call summaries, transcripts, SMS follow-up, and related automation features.
        Specific features may vary depending on your configuration, integrations, provider availability, and service plan.
      </>
    ),
  },
  {
    title: '10. AI and Automation Limitations',
    body: (
      <>
        Aamy.ai uses artificial intelligence and automation technologies. AI-generated responses may not always be perfect,
        complete, or error-free. You are responsible for reviewing your business configuration, service information, pricing,
        policies, and instructions provided to the platform.
      </>
    ),
  },
  {
    title: '11. No Guaranteed Business Results',
    body: (
      <>
        Aamy.ai provides technology and automation services only. We do not guarantee increased revenue, booked appointments,
        sales, customer retention, lead conversion, call volume, or any specific business outcome.
      </>
    ),
  },
  {
    title: '12. Customer Responsibilities',
    body: (
      <>
        You are responsible for providing accurate business information, maintaining lawful business practices, obtaining
        required customer permissions or consents, and ensuring that your use of the service complies with applicable laws,
        regulations, carrier requirements, and industry rules.
      </>
    ),
  },
  {
    title: '13. Acceptable Use',
    body: (
      <>
        You may not use Aamy.ai for unlawful activities, fraud, spam, harassment, deceptive communications, illegal
        telemarketing, prohibited robocalling, abusive behavior, or any activity that violates telecommunications rules,
        carrier policies, privacy laws, or third-party platform policies.
      </>
    ),
  },
  {
    title: '14. Third-Party Providers',
    body: (
      <>
        Aamy.ai may rely on third-party providers, including telecommunications carriers, Twilio, OpenAI, Stripe, hosting
        providers, and other technology vendors. Aamy.ai is not responsible for outages, delays, interruptions, policy
        changes, account restrictions, service degradation, or failures caused by third-party providers.
      </>
    ),
  },
  {
    title: '15. Data and Privacy',
    body: (
      <>
        Your use of Aamy.ai is also governed by our{' '}
        <a href="/privacy-policy" className="underline text-purple-400">
          Privacy Policy
        </a>
        . By using the service, you acknowledge that calls, messages, transcripts, metadata, and related business data may
        be processed as necessary to operate and improve the platform.
      </>
    ),
  },
  {
    title: '16. Call Processing and Recording',
    body: (
      <>
        Depending on configuration and applicable law, calls may be processed, transcribed, summarized, or recorded to
        provide AI voice automation, support, analytics, quality assurance, and service improvement. You are responsible for
        complying with any consent or notice requirements applicable to your business and callers.
      </>
    ),
  },
  {
    title: '17. Intellectual Property',
    body: (
      <>
        Aamy.ai retains all rights, title, and interest in its software, platform, workflows, automation systems, designs,
        code, AI orchestration, business logic, branding, and intellectual property. You retain ownership of your business
        data and customer information.
      </>
    ),
  },
  {
    title: '18. Confidentiality',
    body: (
      <>
        Both parties agree to use commercially reasonable efforts to protect confidential information shared in connection
        with the service. Confidential information does not include information that is publicly available, independently
        developed, or lawfully obtained from another source.
      </>
    ),
  },
  {
    title: '19. Service Changes',
    body: (
      <>
        Aamy.ai may modify, improve, update, replace, or discontinue features from time to time. We will use commercially
        reasonable efforts to avoid material disruption to active customers, but we do not guarantee that every feature will
        remain available permanently.
      </>
    ),
  },
  {
    title: '20. Limitation of Liability',
    body: (
      <>
        To the maximum extent permitted by law, Aamy.ai will not be liable for indirect, incidental, special, consequential,
        exemplary, or punitive damages, including lost profits, lost revenue, lost data, business interruption, or loss of
        goodwill. Aamy.ai’s total liability will not exceed the amount paid by you during the three (3) months before the
        event giving rise to the claim.
      </>
    ),
  },
  {
    title: '21. Disclaimer of Warranties',
    body: (
      <>
        The service is provided on an “as is” and “as available” basis. Aamy.ai does not warrant that the service will be
        uninterrupted, error-free, fully secure, or that it will meet every business requirement or expectation.
      </>
    ),
  },
  {
    title: '22. Termination by Aamy.ai',
    body: (
      <>
        Aamy.ai may suspend or terminate service if you fail to pay, violate these Terms, misuse the platform, engage in
        unlawful activity, violate acceptable use requirements, or create risk for Aamy.ai, its providers, other customers,
        or telecommunications infrastructure.
      </>
    ),
  },
  {
    title: '23. Governing Law',
    body: (
      <>
        These Terms are governed by the laws of the State of Florida, without regard to conflict of law principles.
      </>
    ),
  },
  {
    title: '24. Changes to These Terms',
    body: (
      <>
        Aamy.ai may update these Terms from time to time. Updates will be posted on this page with a revised update date.
        Continued use of the service after changes become effective means you accept the updated Terms.
      </>
    ),
  },
  {
    title: '25. Contact',
    body: (
      <>
        If you have questions about these Terms, contact us at{' '}
        <a href="mailto:support@aamy.ai" className="underline text-purple-400">
          support@aamy.ai
        </a>
        .
      </>
    ),
  },
];

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen p-6 md:p-10 text-white max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <BriefcaseIcon className="h-8 w-8 text-purple-300" />
        <h1 className="text-3xl md:text-4xl font-bold">Terms of Service</h1>
      </div>

      <p className="text-sm text-gray-300 mb-8">Updated: {UPDATED_AT}</p>

      <div className="space-y-8">
        {TOS_SECTIONS.map((section) => (
          <section key={section.title}>
            <h2 className="text-2xl font-semibold text-purple-300 mb-2">{section.title}</h2>
            <div className="text-gray-100 leading-relaxed">{section.body}</div>
          </section>
        ))}
      </div>
    </div>
  );
}