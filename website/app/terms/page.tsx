import type { Metadata } from 'next';
import { LegalDraftNotice } from '@/components/LegalDraftNotice';
import { LegalSection } from '@/components/LegalSection';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms governing use of the Chambé platform.',
};

const SECTIONS = [
  {
    title: '1. Acceptance of Terms',
    placeholder: 'a statement that using the site/forms means agreeing to these terms.',
  },
  {
    title: '2. Description of Service',
    placeholder: 'plain description of Chambé as a marketplace connecting clients with independent contractors, and that Chambé itself does not perform the work.',
  },
  {
    title: '3. Eligibility',
    placeholder: 'age/legal capacity requirements for submitting a job request or contractor application.',
  },
  {
    title: '4. Contractor Marketplace Terms',
    placeholder: "that contractors are independent businesses, not Chambé employees or agents; that acceptance into the network follows Chambé's vetting process and can be revoked; and how estimates relate to final pricing (e.g. subject to on-site confirmation).",
  },
  {
    title: '5. Payments & Fees',
    placeholder: 'how and when payment is collected once this is actually implemented (currently no payment processing exists in the product), and any platform fee structure.',
  },
  {
    title: '6. Prohibited Conduct',
    placeholder: 'circumventing the platform to avoid fees, submitting false information, abusive behavior toward contractors or clients, etc.',
  },
  {
    title: '7. Disclaimers & Limitation of Liability',
    placeholder: "that estimates are non-binding until confirmed, that Chambé disclaims responsibility for the quality of contractor work performed by independent contractors, and standard liability limitations — this section in particular needs real legal review, not placeholder text.",
  },
  {
    title: '8. Indemnification',
    placeholder: 'standard mutual indemnification language, once reviewed by counsel.',
  },
  {
    title: '9. Termination',
    placeholder: "conditions under which a client's or contractor's access can be suspended or terminated.",
  },
  {
    title: '10. Governing Law',
    placeholder: 'jurisdiction (expected to be Ontario, Canada, given the service area — confirm with counsel).',
  },
  {
    title: '11. Changes to These Terms',
    placeholder: 'how updates will be communicated.',
  },
  {
    title: '12. Contact Us',
    placeholder: 'a real contact address for legal/terms questions.',
  },
];

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-20">
      <h1 className="text-4xl font-bold tracking-tight text-foreground">Terms of Service</h1>
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
