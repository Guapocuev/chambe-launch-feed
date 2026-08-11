import type { Metadata } from 'next';
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
        Get steady, qualified job leads in your trade and service area. Tell us about your
        business — we review every application by hand.
      </p>
      <div className="mt-10">
        <ApplyForm />
      </div>
    </div>
  );
}
