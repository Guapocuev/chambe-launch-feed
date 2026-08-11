import type { Metadata } from 'next';
import { LegalContent, type LegalSectionData } from '@/components/LegalContent';
import { pageMetadata } from '@/lib/metadata';

export const metadata: Metadata = pageMetadata(
  'Privacy Policy',
  'How Chambé collects, uses, and protects your information.',
  '/privacy',
);

const SECTIONS: LegalSectionData[] = [
  {
    heading: 'Information We Collect',
    list: [
      'Contact information you provide when requesting an estimate, including your name, phone number, email address, and property address.',
      'Job details you provide, such as a description of the work needed and any photos or files you submit.',
      'Communications, including messages you send us and records of SMS/text messages exchanged during the estimate and matching process.',
      'Usage information such as pages visited and general device/browser information, collected automatically.',
    ],
  },
  {
    heading: 'How We Use Information',
    list: [
      'To generate an AI-assisted price estimate for your job.',
      'To match you with a vetted independent contractor and share relevant job details with that contractor.',
      'To send you updates by SMS or email about your job (for example, when a contractor accepts your job).',
      'To improve our matching and estimate accuracy, and to maintain the security of our Service.',
      'To communicate with you about your account or requests.',
    ],
  },
  {
    heading: 'How We Share Information',
    paragraphs: [
      'We share your job details and contact information with the independent contractor matched to your job so they can contact you and complete the work. We use third-party service providers to operate our Service, including providers for SMS delivery, cloud hosting and database storage, and AI-based estimate generation. These providers process information on our behalf and are not permitted to use it for their own purposes. We do not sell your personal information.',
    ],
  },
  {
    heading: 'Data Retention',
    paragraphs: [
      'We retain your information for as long as needed to provide the Service and for legitimate business purposes, such as record-keeping and legal compliance, after which it is deleted or anonymized.',
    ],
  },
  {
    heading: 'Your Choices',
    paragraphs: [
      'You may contact us at hello@chambe.ca to request access to, correction of, or deletion of your personal information, or to opt out of SMS communications.',
    ],
  },
  {
    heading: 'Security',
    paragraphs: [
      'We take reasonable technical and organizational measures to protect your information, but no method of transmission or storage is completely secure.',
    ],
  },
  {
    heading: "Children's Privacy",
    paragraphs: [
      'The Service is not directed to individuals under 18, and we do not knowingly collect information from children.',
    ],
  },
  {
    heading: 'Changes to This Policy',
    paragraphs: [
      'We may update this Privacy Policy from time to time. We will post the updated version on this page with a new "Last updated" date.',
    ],
  },
  {
    heading: 'Contact Us',
    paragraphs: ['Questions about this Privacy Policy can be sent to hello@chambe.ca.'],
  },
];

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-20">
      <h1 className="text-4xl font-bold tracking-tight text-foreground">Privacy Policy</h1>
      <p className="mt-3 text-sm text-foreground/50">Last updated: August 2026</p>

      <p className="mt-8 text-sm leading-relaxed text-foreground/75">
        Chambé Inc. (&quot;Chambé,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) operates
        chambe.ca and related services (the &quot;Service&quot;), connecting homeowners in Toronto
        and the Greater Toronto Area with independent local contractors. This Privacy Policy
        explains what information we collect, how we use it, and the choices you have.
      </p>

      <LegalContent sections={SECTIONS} />
    </div>
  );
}
