'use client';

import { useActionState } from 'react';
import { SubmitButton } from '@/components/SubmitButton';
import { initialQuoteFormState, submitJobRequest } from './actions';

const inputClass =
  'w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-foreground/40 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand';

const labelClass = 'block text-sm font-medium text-foreground';

export function QuoteForm() {
  const [state, formAction] = useActionState(submitJobRequest, initialQuoteFormState);

  if (state.status === 'success') {
    return (
      <div className="rounded-2xl border border-brand/30 bg-brand/5 p-8">
        <h2 className="text-xl font-semibold text-foreground">You&apos;re all set!</h2>
        {typeof state.quote?.low === 'number' && typeof state.quote?.high === 'number' && (
          <p className="mt-2 text-3xl font-bold text-brand">
            ${state.quote.low} – ${state.quote.high} <span className="text-base font-normal text-foreground/60">CAD</span>
          </p>
        )}
        <p className="mt-3 text-sm text-foreground/70">
          {state.quote?.offers_sent
            ? `We've matched your job with ${state.quote.offers_sent} nearby contractor${state.quote.offers_sent === 1 ? '' : 's'}. They'll be in touch shortly.`
            : "We've logged your job and are lining up a contractor match — we'll be in touch shortly."}
        </p>
      </div>
    );
  }

  if (state.status === 'pending_retry') {
    return (
      <div className="rounded-2xl border border-accent/30 bg-accent/5 p-8">
        <h2 className="text-xl font-semibold text-foreground">Got it!</h2>
        <p className="mt-2 text-sm text-foreground/70">{state.message}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      {state.status === 'error' && (
        <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {state.message}
        </div>
      )}

      <div>
        <label htmlFor="full-name" className={labelClass}>Full name</label>
        <input id="full-name" name="Full Name" type="text" required autoComplete="name" className={`mt-1.5 ${inputClass}`} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="phone" className={labelClass}>Phone number</label>
          <input id="phone" name="Phone Number" type="tel" required autoComplete="tel" placeholder="(647) 555-0199" className={`mt-1.5 ${inputClass}`} />
        </div>
        <div>
          <label htmlFor="email" className={labelClass}>Email (optional)</label>
          <input id="email" name="Email Address" type="email" autoComplete="email" className={`mt-1.5 ${inputClass}`} />
        </div>
      </div>

      <div>
        <label htmlFor="address" className={labelClass}>Job address</label>
        <input id="address" name="Full Address" type="text" required autoComplete="street-address" placeholder="123 Queen St W, Toronto" className={`mt-1.5 ${inputClass}`} />
      </div>

      <div>
        <label htmlFor="description" className={labelClass}>What needs doing?</label>
        <textarea
          id="description"
          name="Detailed Job Description"
          required
          rows={4}
          placeholder="e.g. Kitchen outlet stopped working and sparks a little when I plug things in"
          className={`mt-1.5 ${inputClass}`}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="urgency" className={labelClass}>How urgent is this?</label>
          <select id="urgency" name="Urgency" defaultValue="Not urgent" className={`mt-1.5 ${inputClass}`}>
            <option value="Not urgent">Not urgent</option>
            <option value="Somewhat urgent">Somewhat urgent</option>
            <option value="Emergency — needs immediate attention">Emergency — needs immediate attention</option>
          </select>
        </div>
        <div>
          <label htmlFor="job-length" className={labelClass}>Roughly how big is the job?</label>
          <select id="job-length" name="Job Length" defaultValue="Quick job (under 3 hours)" className={`mt-1.5 ${inputClass}`}>
            <option value="Quick job (under 3 hours)">Quick job (under 3 hours)</option>
            <option value="Half a day">Half a day</option>
            <option value="A full day or more">A full day or more</option>
          </select>
        </div>
      </div>

      <fieldset>
        <legend className={labelClass}>Is this affecting safety or causing damage?</legend>
        <div className="mt-2 flex gap-6">
          <label className="flex items-center gap-2 text-sm text-foreground/80">
            <input type="radio" name="Safety" value="Yes" className="h-4 w-4" />
            Yes
          </label>
          <label className="flex items-center gap-2 text-sm text-foreground/80">
            <input type="radio" name="Safety" value="No" defaultChecked className="h-4 w-4" />
            No
          </label>
        </div>
      </fieldset>

      <SubmitButton>Get My Free Estimate</SubmitButton>
    </form>
  );
}
