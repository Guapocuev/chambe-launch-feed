'use client';

import { useActionState, useState } from 'react';
import { FormStepProgress } from '@/components/FormStepProgress';
import { FormTrustNote } from '@/components/FormTrustNote';
import { QuoteSuccessTimeline } from '@/components/PostSubmitTimeline';
import { SubmitButton } from '@/components/SubmitButton';
import { useFormAnalytics } from '@/hooks/useFormAnalytics';
import {
  formatPhoneInput,
  isValidEmail,
  isValidName,
  isValidPhone,
} from '@/lib/phone';
import { initialQuoteFormState, submitJobRequest } from './actions';

const inputClass =
  'w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-foreground/40 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent';

const labelClass = 'block text-sm font-medium text-foreground';

const TOTAL_STEPS = 4;

interface FormValues {
  description: string;
  urgency: string;
  jobLength: string;
  safety: string;
  address: string;
  fullName: string;
  phone: string;
  email: string;
}

const INITIAL: FormValues = {
  description: '',
  urgency: 'Not urgent',
  jobLength: 'Quick job (under 3 hours)',
  safety: 'No',
  address: '',
  fullName: '',
  phone: '',
  email: '',
};

function fieldClass(hasError: boolean) {
  return `${inputClass} ${hasError ? 'border-red-400 focus:border-red-400 focus:ring-red-400/30' : ''}`;
}

export function QuoteForm() {
  const [state, formAction] = useActionState(submitJobRequest, initialQuoteFormState);
  const { markStarted } = useFormAnalytics('quote', state.status);
  const [step, setStep] = useState(1);
  const [values, setValues] = useState<FormValues>(INITIAL);
  const [stepError, setStepError] = useState<string | null>(null);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const set = (key: keyof FormValues, value: string) => {
    setValues((v) => ({ ...v, [key]: value }));
    setStepError(null);
  };

  const validateStep = (s: number): boolean => {
    if (s === 1) {
      if (!values.description.trim()) {
        setStepError('Please describe what needs doing.');
        return false;
      }
      return true;
    }
    if (s === 2) {
      if (!values.address.trim()) {
        setStepError('Please enter the job address.');
        return false;
      }
      return true;
    }
    if (s === 3) {
      if (!isValidName(values.fullName)) {
        setStepError('Please enter your full name.');
        setTouched({ fullName: true, phone: true, email: true });
        return false;
      }
      if (!isValidPhone(values.phone)) {
        setStepError('Please enter a valid 10-digit phone number.');
        setTouched({ fullName: true, phone: true, email: true });
        return false;
      }
      if (!isValidEmail(values.email)) {
        setStepError('Please enter a valid email address.');
        setTouched({ fullName: true, phone: true, email: true });
        return false;
      }
      return true;
    }
    return true;
  };

  const goNext = () => {
    if (validateStep(step)) setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  };

  const goBack = () => {
    setStepError(null);
    setStep((s) => Math.max(s - 1, 1));
  };

  if (state.status === 'success') {
    return (
      <div className="rounded-2xl border border-accent/30 bg-accent/5 p-8">
        <h2 className="text-xl font-semibold text-foreground">You&apos;re all set!</h2>
        {typeof state.quote?.low === 'number' && typeof state.quote?.high === 'number' && (
          <p className="mt-2 text-3xl font-bold text-accent">
            ${state.quote.low} – ${state.quote.high}{' '}
            <span className="text-base font-normal text-foreground/60">CAD</span>
          </p>
        )}
        <p className="mt-3 text-sm text-foreground/70">
          {state.quote?.offers_sent
            ? `We've matched your job with ${state.quote.offers_sent} nearby contractor${state.quote.offers_sent === 1 ? '' : 's'}. They'll be in touch shortly.`
            : "We've logged your job and are lining up a contractor match — we'll be in touch shortly."}
        </p>
        <QuoteSuccessTimeline />
      </div>
    );
  }

  if (state.status === 'pending_retry') {
    return (
      <div className="rounded-2xl border border-accent/30 bg-accent/5 p-8">
        <h2 className="text-xl font-semibold text-foreground">Got it!</h2>
        <p className="mt-2 text-sm text-foreground/70">{state.message}</p>
        <QuoteSuccessTimeline />
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5" onFocusCapture={markStarted}>
      <FormStepProgress current={step} />

      {state.status === 'error' && (
        <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {state.message}
        </div>
      )}

      {stepError && (
        <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {stepError}
        </div>
      )}

      {/* Hidden fields — always submitted with correct server-action names */}
      <input type="hidden" name="Detailed Job Description" value={values.description} />
      <input type="hidden" name="Urgency" value={values.urgency} />
      <input type="hidden" name="Job Length" value={values.jobLength} />
      <input type="hidden" name="Safety" value={values.safety} />
      <input type="hidden" name="Full Address" value={values.address} />
      <input type="hidden" name="Full Name" value={values.fullName} />
      <input type="hidden" name="Phone Number" value={values.phone} />
      <input type="hidden" name="Email Address" value={values.email} />

      {step === 1 && (
        <div className="space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Tell us about the job</h2>
            <p className="mt-1 text-sm text-foreground/60">Takes about two minutes — no account needed.</p>
          </div>
          <div>
            <label htmlFor="description" className={labelClass}>
              What needs doing?
            </label>
            <textarea
              id="description"
              required
              rows={4}
              value={values.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="e.g. Kitchen outlet stopped working and sparks a little when I plug things in"
              className={`mt-1.5 ${inputClass}`}
            />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="urgency" className={labelClass}>
                How urgent is this?
              </label>
              <select
                id="urgency"
                value={values.urgency}
                onChange={(e) => set('urgency', e.target.value)}
                className={`mt-1.5 ${inputClass}`}
              >
                <option value="Not urgent">Not urgent</option>
                <option value="Somewhat urgent">Somewhat urgent</option>
                <option value="Emergency — needs immediate attention">
                  Emergency — needs immediate attention
                </option>
              </select>
            </div>
            <div>
              <label htmlFor="job-length" className={labelClass}>
                Roughly how big is the job?
              </label>
              <select
                id="job-length"
                value={values.jobLength}
                onChange={(e) => set('jobLength', e.target.value)}
                className={`mt-1.5 ${inputClass}`}
              >
                <option value="Quick job (under 3 hours)">Quick job (under 3 hours)</option>
                <option value="Half a day">Half a day</option>
                <option value="A full day or more">A full day or more</option>
              </select>
            </div>
          </div>
          <fieldset>
            <legend className={labelClass}>Is this affecting safety or causing damage?</legend>
            <div className="mt-2 flex gap-6">
              {(['Yes', 'No'] as const).map((v) => (
                <label key={v} className="flex items-center gap-2 text-sm text-foreground/80">
                  <input
                    type="radio"
                    name="safety-ui"
                    value={v}
                    checked={values.safety === v}
                    onChange={() => set('safety', v)}
                    className="h-4 w-4"
                  />
                  {v}
                </label>
              ))}
            </div>
          </fieldset>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Where is the job?</h2>
            <p className="mt-1 text-sm text-foreground/60">
              We use this to match you with a contractor in your neighbourhood.
            </p>
          </div>
          <div>
            <label htmlFor="address" className={labelClass}>
              Job address
            </label>
            <input
              id="address"
              type="text"
              required
              autoComplete="street-address"
              value={values.address}
              onChange={(e) => set('address', e.target.value)}
              placeholder="123 Queen St W, Toronto"
              className={`mt-1.5 ${inputClass}`}
            />
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-foreground">How can we reach you?</h2>
            <p className="mt-1 text-sm text-foreground/60">
              Your matched contractor will contact you directly — we never share your info with anyone else.
            </p>
          </div>
          <div>
            <label htmlFor="full-name" className={labelClass}>
              Full name
            </label>
            <input
              id="full-name"
              type="text"
              required
              autoComplete="name"
              value={values.fullName}
              onChange={(e) => set('fullName', e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, fullName: true }))}
              aria-invalid={touched.fullName && !isValidName(values.fullName)}
              className={`mt-1.5 ${fieldClass(touched.fullName && !isValidName(values.fullName))}`}
            />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="phone" className={labelClass}>
                Phone number
              </label>
              <input
                id="phone"
                type="tel"
                required
                autoComplete="tel"
                inputMode="tel"
                value={values.phone}
                onChange={(e) => set('phone', formatPhoneInput(e.target.value))}
                onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
                placeholder="(647) 555-0199"
                aria-invalid={touched.phone && !isValidPhone(values.phone)}
                className={`mt-1.5 ${fieldClass(touched.phone && !isValidPhone(values.phone))}`}
              />
            </div>
            <div>
              <label htmlFor="email" className={labelClass}>
                Email (optional)
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={values.email}
                onChange={(e) => set('email', e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                aria-invalid={touched.email && !isValidEmail(values.email)}
                className={`mt-1.5 ${fieldClass(touched.email && !isValidEmail(values.email))}`}
              />
            </div>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Review your request</h2>
            <p className="mt-1 text-sm text-foreground/60">Make sure everything looks right before we calculate your estimate.</p>
          </div>
          <dl className="divide-y divide-border rounded-xl border border-border text-sm">
            <div className="grid grid-cols-3 gap-2 px-4 py-3">
              <dt className="text-foreground/50">Job</dt>
              <dd className="col-span-2 text-foreground">{values.description}</dd>
            </div>
            <div className="grid grid-cols-3 gap-2 px-4 py-3">
              <dt className="text-foreground/50">Urgency</dt>
              <dd className="col-span-2 text-foreground">{values.urgency}</dd>
            </div>
            <div className="grid grid-cols-3 gap-2 px-4 py-3">
              <dt className="text-foreground/50">Address</dt>
              <dd className="col-span-2 text-foreground">{values.address}</dd>
            </div>
            <div className="grid grid-cols-3 gap-2 px-4 py-3">
              <dt className="text-foreground/50">Contact</dt>
              <dd className="col-span-2 text-foreground">
                {values.fullName} · {values.phone}
                {values.email ? ` · ${values.email}` : ''}
              </dd>
            </div>
          </dl>
          <FormTrustNote variant="homeowner" />
        </div>
      )}

      <div className="flex gap-3 pt-2">
        {step > 1 && (
          <button
            type="button"
            onClick={goBack}
            className="rounded-full border border-border px-6 py-3 text-sm font-semibold text-foreground transition hover:border-brand"
          >
            Back
          </button>
        )}
        {step < TOTAL_STEPS ? (
          <button
            type="button"
            onClick={goNext}
            className="ml-auto rounded-full bg-accent px-7 py-3 text-sm font-semibold text-brand transition hover:bg-accent-dark"
          >
            Continue
          </button>
        ) : (
          <div className="ml-auto">
            <SubmitButton>Get My Free Estimate</SubmitButton>
          </div>
        )}
      </div>

      {step === TOTAL_STEPS && (
        <p className="text-center text-xs text-foreground/50">
          By submitting, you agree to our{' '}
          <a href="/privacy" className="underline hover:text-brand">
            Privacy Policy
          </a>
          . We never share your number with anyone except your matched contractor.
        </p>
      )}
    </form>
  );
}
