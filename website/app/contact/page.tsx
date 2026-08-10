import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Get in touch with Chambé.',
};

// Placeholder contact address — swap for the real shared inbox before
// launch. Deliberately not using a personal email here.
const CONTACT_EMAIL = 'hello@chambe.ca';

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-20">
      <h1 className="text-4xl font-bold tracking-tight text-foreground">Get in touch</h1>
      <p className="mt-4 text-lg text-foreground/70">
        Serving Toronto and the GTA. For anything not covered by the forms below, reach us directly.
      </p>

      <div className="mt-10 rounded-2xl border border-border p-6">
        <div className="text-sm font-semibold uppercase tracking-wide text-foreground/50">Email</div>
        <a href={`mailto:${CONTACT_EMAIL}`} className="mt-1 block text-lg font-medium text-brand hover:underline">
          {CONTACT_EMAIL}
        </a>
        <p className="mt-2 text-sm text-foreground/60">We typically reply within one business day.</p>
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <div className="rounded-2xl border border-border p-6">
          <h2 className="text-lg font-semibold text-foreground">Have a job that needs doing?</h2>
          <p className="mt-2 text-sm text-foreground/70">
            Skip the email — our request form gets you an instant estimate and a contractor match
            much faster than we can reply by hand.
          </p>
          <Link href="/get-a-quote" className="mt-4 inline-block text-sm font-semibold text-brand hover:underline">
            Get a free estimate →
          </Link>
        </div>
        <div className="rounded-2xl border border-border p-6">
          <h2 className="text-lg font-semibold text-foreground">Are you a contractor?</h2>
          <p className="mt-2 text-sm text-foreground/70">
            Apply directly and we&apos;ll follow up about onboarding, service area, and vetting.
          </p>
          <Link href="/apply" className="mt-4 inline-block text-sm font-semibold text-brand hover:underline">
            Apply as a contractor →
          </Link>
        </div>
      </div>
    </div>
  );
}
