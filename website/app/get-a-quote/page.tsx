import type { Metadata } from 'next';
import { QuoteForm } from './QuoteForm';

export const metadata: Metadata = {
  title: 'Get a Free Estimate',
  description: 'Tell us about your job and get an instant AI-powered price estimate.',
};

export default function GetAQuotePage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-20">
      <h1 className="text-4xl font-bold tracking-tight text-foreground">Get a free estimate</h1>
      <p className="mt-4 text-lg text-foreground/70">
        Tell us about the job. We&apos;ll give you an instant price range and start matching you
        with a vetted contractor in your area.
      </p>
      <div className="mt-10">
        <QuoteForm />
      </div>
    </div>
  );
}
