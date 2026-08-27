import type { Metadata } from 'next';
import Link from 'next/link';
import { APPLICANT_CALLBACK_WINDOW, CALLBACK_WINDOW, MATCH_WINDOW } from '@/lib/response-time';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Get in touch with Chambé.',
};

// Matches the address used in the Privacy Policy and Terms of Service.
const CONTACT_EMAIL = 'hello@chambe.ca';

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-20">
      <h1 className="text-4xl font-bold tracking-tight text-foreground">Get in touch</h1>
      <p className="mt-4 text-lg text-foreground/70">
        Serving Toronto and the GTA. For a job that needs doing, use the estimate form — that is
        how you get a contractor match and a callback. Email is for everything else.
      </p>

      <div className="mt-10 rounded-2xl border border-border p-6">
        <div className="text-sm font-semibold uppercase tracking-wide text-foreground/50">Email</div>
        <a href={`mailto:${CONTACT_EMAIL}`} className="mt-1 block text-lg font-medium text-brand hover:underline">
          {CONTACT_EMAIL}
        </a>
        <p className="mt-2 text-sm text-foreground/60">
          For press, partnerships, and questions that are not a job request. Job requests go through
          the form so we can hit the match and callback times below.
        </p>
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <div className="rounded-2xl border border-border p-6">
          <h2 className="text-lg font-semibold text-foreground">Have a job that needs doing?</h2>
          <p className="mt-2 text-sm text-foreground/70">
            {MATCH_WINDOW} {CALLBACK_WINDOW}
          </p>
          <Link href="/get-a-quote" className="mt-4 inline-block text-sm font-semibold text-brand hover:underline">
            Get a free estimate →
          </Link>
        </div>
        <div className="rounded-2xl border border-border p-6">
          <h2 className="text-lg font-semibold text-foreground">Are you a contractor?</h2>
          <p className="mt-2 text-sm text-foreground/70">
            Qualified leads in your trade and area. You accept or pass. {APPLICANT_CALLBACK_WINDOW}
          </p>
          <Link href="/apply" className="mt-4 inline-block text-sm font-semibold text-brand hover:underline">
            Apply as a contractor →
          </Link>
        </div>
      </div>
    </div>
  );
}
