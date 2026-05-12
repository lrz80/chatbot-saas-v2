'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

const UPDATED_AT = '2026-05-11';

type PrivacySection = {
  title: string;
  body: React.ReactNode;
};

const PRIVACY_SECTIONS: PrivacySection[] = [
  {
    title: '1. Information We Collect',
    body: (
      <>
        <p>We may collect information provided by our customers, their businesses, and their end users, including:</p>
        <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
          <li>Business name, contact information, address, operating hours, services, pricing, and policies</li>
          <li>Customer names, phone numbers, email addresses, appointment details, and communication preferences</li>
          <li>Call metadata, call transcripts, call summaries, voicemail information, and message history</li>
          <li>SMS delivery information and related communication records</li>
          <li>Account, billing, subscription, and payment-related information</li>
          <li>Technical information such as IP address, browser type, device information, logs, and usage analytics</li>
          <li>Configuration data used to operate AI voice automation, including prompts, business instructions, FAQs, and workflows</li>
        </ul>
      </>
    ),
  },
  {
    title: '2. How We Use Information',
    body: (
      <>
        <p>We use collected information to:</p>
        <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
          <li>Provide AI voice receptionist and call automation services</li>
          <li>Process, answer, route, summarize, or automate inbound business calls</li>
          <li>Assist with appointment scheduling, customer follow-up, and SMS notifications when enabled</li>
          <li>Personalize responses based on the customer’s business configuration</li>
          <li>Maintain, secure, monitor, troubleshoot, and improve the platform</li>
          <li>Process subscriptions, payments, billing records, and account administration</li>
          <li>Comply with legal, regulatory, carrier, and payment processor requirements</li>
        </ul>
      </>
    ),
  },
  {
    title: '3. AI Voice Processing',
    body: (
      <p>
        Aamy.ai uses artificial intelligence and automation technologies to process business communications. This may include
        speech recognition, transcription, natural language processing, AI-generated responses, call summaries, and automated
        decision support based on the business configuration provided by the customer.
      </p>
    ),
  },
  {
    title: '4. Call Transcripts, Recordings, and Metadata',
    body: (
      <p>
        Depending on the customer’s configuration, applicable law, and service requirements, calls may be processed,
        transcribed, summarized, analyzed, stored, or recorded. Call-related data may be used to provide the service,
        improve quality, support customers, debug issues, monitor performance, and maintain accurate business records.
      </p>
    ),
  },
  {
    title: '5. Payment and Subscription Data',
    body: (
      <p>
        Payments and recurring subscriptions may be processed through Stripe or another authorized payment processor.
        Aamy.ai does not store full credit card numbers. Payment processors may collect and process billing details,
        payment method information, transaction records, and fraud prevention data according to their own terms and privacy
        policies.
      </p>
    ),
  },
  {
    title: '6. Third-Party Service Providers',
    body: (
      <>
        <p>
          We may share information with trusted service providers only as necessary to operate, secure, bill, support, and
          improve the service. These providers may include:
        </p>
        <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
          <li>Telecommunications and voice providers, including Twilio and phone carriers</li>
          <li>Artificial intelligence and language processing providers, including OpenAI</li>
          <li>Payment processors, including Stripe</li>
          <li>Cloud hosting, database, storage, analytics, security, and infrastructure providers</li>
          <li>Calendar, booking, CRM, or messaging integrations enabled by the customer</li>
        </ul>
        <p className="mt-2">
          We do not sell personal information. We may disclose information if required by law, legal process, enforcement
          request, or to protect Aamy.ai, our customers, end users, providers, or the public.
        </p>
      </>
    ),
  },
  {
    title: '7. Customer Responsibilities',
    body: (
      <p>
        Customers are responsible for ensuring that their use of Aamy.ai complies with all laws and regulations applicable to
        their business, including privacy, consent, call recording, telecommunications, SMS, telemarketing, and customer
        communication laws. Customers are responsible for providing any legally required notices or obtaining any required
        consents from callers, customers, employees, or end users.
      </p>
    ),
  },
  {
    title: '8. Data Retention',
    body: (
      <p>
        We retain information for as long as reasonably necessary to provide the service, maintain business records, comply
        with legal obligations, resolve disputes, enforce agreements, prevent abuse, and improve platform reliability. Some
        data may be deleted, anonymized, or aggregated when it is no longer required for these purposes.
      </p>
    ),
  },
  {
    title: '9. Data Security',
    body: (
      <p>
        We use commercially reasonable administrative, technical, and organizational safeguards designed to protect
        information against unauthorized access, loss, misuse, alteration, or disclosure. However, no system, transmission,
        or storage method is completely secure, and we cannot guarantee absolute security.
      </p>
    ),
  },
  {
    title: '10. International and Cross-Border Processing',
    body: (
      <p>
        Information may be processed and stored in the United States or other locations where Aamy.ai or its service
        providers operate. By using the service, customers acknowledge that information may be transferred to and processed
        in jurisdictions that may have different data protection laws.
      </p>
    ),
  },
  {
    title: '11. Access, Correction, and Deletion Requests',
    body: (
      <p>
        Customers may contact Aamy.ai to request access, correction, deletion, or export of certain information, subject to
        identity verification, legal obligations, security requirements, and technical limitations. End users should first
        contact the business with which they communicated, because Aamy.ai often processes end-user information on behalf of
        that business.
      </p>
    ),
  },
  {
    title: '12. Children’s Privacy',
    body: (
      <p>
        Aamy.ai is intended for business use and is not directed to children. We do not knowingly collect personal
        information from children under 13. If we become aware that such information has been collected, we will take
        reasonable steps to delete it.
      </p>
    ),
  },
  {
    title: '13. Changes to This Privacy Policy',
    body: (
      <p>
        We may update this Privacy Policy from time to time. Updates will be posted on this page with a revised update date.
        Continued use of the service after an update means the customer acknowledges the updated policy.
      </p>
    ),
  },
  {
    title: '14. Contact',
    body: (
      <>
        <p>If you have questions about this Privacy Policy or wish to submit a privacy request, contact us at:</p>
        <ul className="list-none ml-4 mt-2">
          <li>
            Email:{' '}
            <a href="mailto:support@aamy.ai" className="text-purple-400 underline">
              support@aamy.ai
            </a>
          </li>
          <li>
            Website:{' '}
            <a href="https://www.aamy.ai" className="text-purple-400 underline">
              https://www.aamy.ai
            </a>
          </li>
        </ul>
      </>
    ),
  },
];

export default function PrivacyPolicyPage() {
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

        <h1 className="text-3xl md:text-4xl font-extrabold text-center mb-8 text-purple-300">
          Privacy Policy
        </h1>

        <div className="space-y-6 text-sm md:text-base text-gray-300 leading-relaxed">
          <p>
            This Privacy Policy explains how Aamy.ai collects, uses, processes, stores, and protects information in
            connection with our AI voice automation services, website, platform, subscriptions, and related business
            communication tools.
          </p>

          {PRIVACY_SECTIONS.map((section) => (
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