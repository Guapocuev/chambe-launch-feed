import type { Metadata } from 'next';
import Link from 'next/link';
import { APPLICANT_CALLBACK } from '@/lib/response-time';
import { ApplyForm } from './ApplyForm';
import { pageMetadata } from '@/lib/metadata';

export const metadata: Metadata = pageMetadata(
  'Become a Contractor',
  'Apply to join the Chambé contractor network in Toronto and the GTA.',
  '/apply',
);

export default function ApplyPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-20">
      <h1 className="text-4xl font-bold tracking-tight text-foreground">Become a Chambé contractor</h1>
      <p className="mt-4 text-lg text-foreground/70">
        Qualified job leads in your trade and area. You accept the ones that fit and pass on the
        rest. We call you within {APPLICANT_CALLBACK}.
      </p>
      <ul className="mt-6 space-y-2 text-sm text-foreground/80">
        <li>Leads are already scoped and priced — no cold-calling for work.</li>
        <li>Accept or pass from your phone.</li>
        <li>We call every applicant within {APPLICANT_CALLBACK}.</li>
      </ul>
      <div className="mt-10">
        <ApplyForm />
      </div>
      <p className="mt-8 text-sm text-foreground/50">
        Already matched on a job?{' '}
        <Link href="/contractor" className="font-medium text-foreground underline-offset-2 hover:underline">
          Open job tools
        </Link>{' '}
        to log hours and materials.
      </p>
    </div>
  );
}
