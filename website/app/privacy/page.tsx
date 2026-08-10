import type { Metadata } from 'next';
import { LegalDraftNotice } from '@/components/LegalDraftNotice';
import { LegalSection } from '@/components/LegalSection';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How Chambé collects, uses, and protects your information.',
};

const SECTIONS = [
  {
    title: '1. Introduction',
    placeholder: 'who this policy covers (site visitors, clients submitting job requests, contractor applicants) and when it takes effect.',
  },
  {
    title: '2. Information We Collect',
    placeholder: 'contact details from the request/apply forms (name, phone, email, address), job descriptions and photos, and any usage/analytics data collected by the site itself.',
  },
  {
    title: '3. How We Use Your Information',
    placeholder: 'matching clients to contractors, generating price estimates, contacting applicants about their application, and operational communication (e.g. job-status SMS).',
  },
  {
    title: '4. Sharing & Disclosure',
    placeholder: "what's shared with matched contractors (e.g. client phone/address once a job is assigned), any third-party processors (SMS provider, hosting, database), and that data is never sold.",
  },
  {
    title: '5. Data Retention',
    placeholder: 'how long job requests, quotes, and contractor applications are kept, and what happens to rejected/unconverted applications.',
  },
  {
    title: '6. Your Rights & Choices',
    placeholder: 'how someone can request access to, correction of, or deletion of their data, and who to contact to do so.',
  },
  {
    title: '7. Cookies & Tracking',
    placeholder: 'what analytics or tracking (if any) this site uses once real tooling is chosen.',
  },
  {
    title: '8. Security',
    placeholder: "a plain-language summary of how data is protected (e.g. encrypted connections, access controls) — accurate to what's actually implemented, not aspirational.",
  },
  {
    title: "9. Children's Privacy",
    placeholder: 'a statement that the service is not directed at children and is not knowingly used to collect their data.',
  },
  {
    title: '10. Changes to This Policy',
    placeholder: 'how updates will be communicated (e.g. updated date on this page, email notice for material changes).',
  },
  {
    title: '11. Contact Us',
    placeholder: 'a real contact address for privacy questions/requests.',
  },
];

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-20">
      <h1 className="text-4xl font-bold tracking-tight text-foreground">Privacy Policy</h1>
      <p className="mt-3 text-sm text-foreground/50">Last updated: —</p>

      <div className="mt-8">
        <LegalDraftNotice />
      </div>

      <div>
        {SECTIONS.map((section) => (
          <LegalSection key={section.title} title={section.title} placeholder={section.placeholder} />
        ))}
      </div>
    </div>
  );
}
