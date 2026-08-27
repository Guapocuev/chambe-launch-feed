import type { Metadata } from 'next';
import { CALLBACK_WINDOW, MATCH_WINDOW } from '@/lib/response-time';
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
        Tell us about the job. You&apos;ll get an instant price range. {MATCH_WINDOW}{' '}
        {CALLBACK_WINDOW}
      </p>
      <div className="mt-10">
        <QuoteForm />
      </div>
    </div>
  );
}
