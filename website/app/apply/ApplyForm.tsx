'use client';

import { useActionState } from 'react';
import { SubmitButton } from '@/components/SubmitButton';
import { initialApplyFormState, submitContractorApplication } from './actions';

const inputClass =
  'w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-foreground/40 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand';

const labelClass = 'block text-sm font-medium text-foreground';

const TRADES = [
  { value: 'electrical', label: 'Electrical' },
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'carpentry', label: 'Carpentry' },
];

export function ApplyForm() {
  const [state, formAction] = useActionState(submitContractorApplication, initialApplyFormState);

  if (state.status === 'success') {
    return (
      <div className="rounded-2xl border border-brand/30 bg-brand/5 p-8">
        <h2 className="text-xl font-semibold text-foreground">Application received!</h2>
        <p className="mt-2 text-sm text-foreground/70">
          Thanks for applying to Chambé. Our team reviews every application by hand — we&apos;ll be
          in touch about next steps and vetting.
        </p>
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
        <label htmlFor="full_name" className={labelClass}>Full name</label>
        <input id="full_name" name="full_name" type="text" required autoComplete="name" className={`mt-1.5 ${inputClass}`} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="phone" className={labelClass}>Phone number</label>
          <input id="phone" name="phone" type="tel" required autoComplete="tel" placeholder="(647) 555-0199" className={`mt-1.5 ${inputClass}`} />
        </div>
        <div>
          <label htmlFor="email" className={labelClass}>Email (optional)</label>
          <input id="email" name="email" type="email" autoComplete="email" className={`mt-1.5 ${inputClass}`} />
        </div>
      </div>

      <fieldset>
        <legend className={labelClass}>Trade(s) — select all that apply</legend>
        <div className="mt-2 flex flex-wrap gap-4">
          {TRADES.map((trade) => (
            <label key={trade.value} className="flex items-center gap-2 text-sm text-foreground/80">
              <input type="checkbox" name="trade" value={trade.value} className="h-4 w-4 rounded" />
              {trade.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="service_area" className={labelClass}>Service area</label>
        <input
          id="service_area"
          name="service_area"
          type="text"
          required
          placeholder="e.g. Downtown Toronto, North York"
          className={`mt-1.5 ${inputClass}`}
        />
      </div>

      <div>
        <label htmlFor="years_experience" className={labelClass}>Years of experience</label>
        <input id="years_experience" name="years_experience" type="number" min="0" step="1" className={`mt-1.5 ${inputClass}`} />
      </div>

      <div>
        <label htmlFor="notes" className={labelClass}>Anything else we should know?</label>
        <textarea
          id="notes"
          name="notes"
          rows={4}
          placeholder="Licences, certifications, availability, past work, etc."
          className={`mt-1.5 ${inputClass}`}
        />
      </div>

      <SubmitButton>Submit Application</SubmitButton>
    </form>
  );
}
