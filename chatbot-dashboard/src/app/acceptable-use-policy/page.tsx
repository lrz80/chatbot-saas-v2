'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, ShieldAlert } from 'lucide-react';

const UPDATED_AT = '2026-05-11';

type PolicySection = {
  title: string;
  body: React.ReactNode;
};

const POLICY_SECTIONS: PolicySection[] = [
  {
    title: '1. Purpose',
    body: (
      <p>
        This Acceptable Use Policy explains the rules that apply when using Aamy.ai, including Aamy Voice Pro, AI voice automation,
        call handling, SMS follow-up, and related communication services.
      </p>
    ),
  },
  {
    title: '2. Lawful Use Required',
    body: (
      <p>
        You may only use Aamy.ai for lawful business purposes. You are responsible for ensuring that your use of the service
        complies with all applicable laws, regulations, carrier rules, platform policies, privacy requirements, and consent
        obligations.
      </p>
    ),
  },
  {
    title: '3. Prohibited Uses',
    body: (
      <>
        <p>You may not use Aamy.ai for:</p>
        <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
          <li>Fraud, scams, impersonation, or deceptive business practices</li>
          <li>Illegal telemarketing, unlawful robocalling, or prohibited automated calling</li>
          <li>Spam, unsolicited communications, or abusive messaging</li>
          <li>Harassment, threats, hate, intimidation, or abusive communications</li>
          <li>Collecting sensitive information without proper legal basis or consent</li>
          <li>Violating TCPA, carrier, telecommunications, privacy, or consumer protection rules</li>
          <li>Misrepresenting your identity, business, services, prices, availability, or policies</li>
          <li>Any activity that may harm Aamy.ai, its providers, carriers, infrastructure, customers, or end users</li>
        </ul>
      </>
    ),
  },
  {
    title: '4. Consent and Communication Compliance',
    body: (
      <p>
        You are responsible for obtaining and maintaining all required permissions, consents, notices, and legal bases before
        communicating with customers, callers, leads, or end users through Aamy.ai. This includes compliance with call recording,
        SMS, telemarketing, privacy, and customer communication laws.
      </p>
    ),
  },
  {
    title: '5. AI Voice and Call Automation',
    body: (
      <p>
        You must not configure Aamy.ai to mislead callers into believing they are speaking with a human when disclosure is
        legally required. You are responsible for ensuring that AI voice automation, call handling, recordings, transcripts,
        and automated responses are used lawfully and appropriately for your business.
      </p>
    ),
  },
  {
    title: '6. SMS and Follow-Up Messages',
    body: (
      <p>
        If SMS follow-up is enabled, you are responsible for ensuring that recipients have provided any required consent to
        receive text messages. You may not use Aamy.ai to send unlawful, misleading, abusive, or unsolicited SMS messages.
      </p>
    ),
  },
  {
    title: '7. Third-Party Provider Rules',
    body: (
      <p>
        Your use of Aamy.ai may be subject to rules from third-party providers, including telecommunications carriers, Twilio,
        OpenAI, Stripe, cloud infrastructure providers, and other integrations. You may not use Aamy.ai in a way that violates
        those providers’ policies or creates risk to Aamy.ai’s accounts, infrastructure, or other customers.
      </p>
    ),
  },
  {
    title: '8. Accurate Business Information',
    body: (
      <p>
        You are responsible for providing accurate and updated business information, including services, pricing, availability,
        hours, policies, location, contact details, and booking instructions. Aamy.ai is not responsible for inaccurate responses
        caused by incorrect, outdated, incomplete, or misleading information provided by you.
      </p>
    ),
  },
  {
    title: '9. Security',
    body: (
      <p>
        You may not attempt to disrupt, overload, reverse engineer, scrape, bypass security, gain unauthorized access to, or
        interfere with Aamy.ai, its systems, APIs, integrations, data, or infrastructure.
      </p>
    ),
  },
  {
    title: '10. Suspension or Termination',
    body: (
      <p>
        Aamy.ai may suspend, restrict, or terminate access immediately if we believe your use violates this policy, creates
        legal or operational risk, harms service providers or carriers, affects other customers, or may expose Aamy.ai to
        liability, account suspension, chargebacks, penalties, or enforcement action.
      </p>
    ),
  },
  {
    title: '11. Reporting Abuse',
    body: (
      <p>
        If you believe Aamy.ai is being used in violation of this policy, contact us at{' '}
        <a href="mailto:support@aamy.ai" className="underline text-purple-400">
          support@aamy.ai
        </a>
        .
      </p>
    ),
  },
  {
    title: '12. Changes to This Policy',
    body: (
      <p>
        Aamy.ai may update this Acceptable Use Policy from time to time. Updates will be posted on this page with a revised
        update date. Continued use of the service after updates means you accept the updated policy.
      </p>
    ),
  },
];

export default function AcceptableUsePolicyPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0e0e2c] to-[#1e1e3f] text-white px-6 py-8">
      <div className="max-w-4xl mx-auto bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 shadow-md">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300 mb-6"
        >
          <ArrowLeft size={20} />
          Back
        </button>

        <div className="flex justify-center mb-4">
          <ShieldAlert className="h-10 w-10 text-purple-300" />
        </div>

        <h1 className="text-3xl md:text-4xl font-extrabold text-center mb-8 text-purple-300">
          Acceptable Use Policy
        </h1>

        <div className="space-y-6 text-sm md:text-base text-gray-300 leading-relaxed">
          <p>
            This Acceptable Use Policy applies to all customers, users, and businesses using Aamy.ai services.
          </p>

          {POLICY_SECTIONS.map((section) => (
            <section key={section.title}>
              <h2 className="text-xl text-purple-200 font-bold mt-6">{section.title}</h2>
              {section.body}
            </section>
          ))}

          <p className="mt-8 text-sm text-gray-400">Last updated: {UPDATED_AT}</p>
        </div>
      </div>
    </div>
  );
}