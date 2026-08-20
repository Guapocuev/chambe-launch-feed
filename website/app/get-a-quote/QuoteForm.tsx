'use client';

import { useActionState, useState } from 'react';
import { SubmitButton } from '@/components/SubmitButton';
import { checkReturningClient, initialQuoteFormState, submitJobRequest } from './actions';
import { QuotePhotoUpload } from './QuotePhotoUpload';

const inputClass =
  'w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-foreground/40 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand';

const labelClass = 'block text-sm font-medium text-foreground';

interface Prefill {
  full_name?: string;
  email?: string;
  address?: string;
}

type PhoneStage = 'entry' | 'checking' | 'ask-consent';

export function QuoteForm() {
  const [state, formAction] = useActionState(submitJobRequest, initialQuoteFormState);

  // Step 1: just a phone number, so a returning client can be looked up
  // before anything else is asked. Step 2 is the rest of the job details,
  // pre-filled when step 1 finds a match.
  const [step, setStep] = useState<'phone' | 'details'>('phone');
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [phoneStage, setPhoneStage] = useState<PhoneStage>('entry');

  // Whether this submission should be remembered (written to
  // returning_clients) — sent to the backend as a literal "true"/"false"
  // string via a hidden input, always set by the time step 2 is reachable
  // (either from the Yes/No choice below, or auto-set true for a match).
  const [remember, setRemember] = useState(false);
  const [prefill, setPrefill] = useState<Prefill | null>(null);
  const [isReturning, setIsReturning] = useState(false);
  const [photosBusy, setPhotosBusy] = useState(false);

  async function handlePhoneContinue() {
    const trimmed = phone.trim();
    if (!trimmed) {
      setPhoneError('Enter your phone number to continue.');
      return;
    }
    setPhoneError(null);
    setPhoneStage('checking');

    const match = await checkReturningClient(trimmed);

    if (match.found) {
      // Skip the consent question entirely for a returning match — they
      // already opted in on a previous visit, and asking again every
      // single time is exactly the retyping-everything friction this
      // feature exists to remove. Pre-set true rather than silently
      // reusing whatever they picked last time without saying so: the
      // "Welcome back" note on step 2 makes the assumption visible and
      // lets them turn it back off in one click, so consent stays
      // revocable instead of just assumed forever.
      setPrefill({ full_name: match.full_name, email: match.email, address: match.address });
      setRemember(true);
      setIsReturning(true);
      setStep('details');
    } else {
      // No match — ask explicitly, still on step 1.
      setPhoneStage('ask-consent');
    }
  }

  function chooseRemember(value: boolean) {
    setRemember(value);
    setStep('details');
  }

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
    <form
      action={formAction}
      onSubmit={(e) => {
        if (photosBusy) e.preventDefault();
      }}
      className="space-y-5"
    >
      {state.status === 'error' && (
        <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {state.message}
        </div>
      )}

      {/* Carried into the real submission either way — hidden inputs
          rather than relying on component state alone, since only
          fields actually inside the <form> end up in the FormData the
          Server Action receives. */}
      <input type="hidden" name="Phone Number" value={phone} readOnly />
      <input type="hidden" name="rememberClient" value={remember ? 'true' : 'false'} readOnly />

      {step === 'phone' && (
        <div className="space-y-4">
          <div>
            <label htmlFor="phone-step" className={labelClass}>Phone number</label>
            <input
              id="phone-step"
              type="tel"
              required
              autoComplete="tel"
              placeholder="(647) 555-0199"
              value={phone}
              disabled={phoneStage !== 'entry'}
              onChange={(e) => {
                setPhone(e.target.value);
                setPhoneError(null);
              }}
              className={`mt-1.5 ${inputClass}`}
            />
            {phoneError && <p className="mt-1.5 text-sm text-red-700 dark:text-red-400">{phoneError}</p>}
            <p className="mt-1.5 text-xs text-foreground/50">
              We check this first to see if we already have your info on file.
            </p>
          </div>

          {phoneStage === 'entry' && (
            <button
              type="button"
              onClick={handlePhoneContinue}
              className="w-full rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition hover:bg-accent-dark sm:w-auto"
            >
              Continue
            </button>
          )}

          {phoneStage === 'checking' && (
            <button
              type="button"
              disabled
              className="w-full rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white opacity-60 sm:w-auto"
            >
              Checking…
            </button>
          )}

          {phoneStage === 'ask-consent' && (
            <div className="rounded-lg border border-border bg-surface p-4">
              <p className="text-sm font-medium text-foreground">
                Save my info so next time you only need photos and an address?
              </p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() => chooseRemember(true)}
                  className="rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-dark"
                >
                  Yes, remember me
                </button>
                <button
                  type="button"
                  onClick={() => chooseRemember(false)}
                  className="rounded-full border border-border px-6 py-2.5 text-sm font-semibold text-foreground transition hover:border-brand hover:text-brand"
                >
                  No, just this once
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {step === 'details' && (
        <div className="space-y-5">
          <div className="rounded-lg border border-border bg-surface px-4 py-3 text-sm">
            <span className="text-foreground/70">Phone: </span>
            <span className="font-medium text-foreground">{phone}</span>
            <button
              type="button"
              onClick={() => {
                setStep('phone');
                setPhoneStage('entry');
                setIsReturning(false);
                setPrefill(null);
              }}
              className="ml-3 text-sm font-semibold text-brand hover:underline"
            >
              Edit
            </button>
          </div>

          {isReturning && (
            <div className="rounded-lg border border-brand/30 bg-brand/5 px-4 py-3 text-sm text-foreground/80">
              Welcome back! We&apos;ve filled in what we remembered.{' '}
              <label className="ml-1 inline-flex items-center gap-1.5 font-medium">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-4 w-4 rounded"
                />
                Keep remembering me
              </label>
            </div>
          )}

          <div>
            <label htmlFor="full-name" className={labelClass}>Full name</label>
            <input
              id="full-name"
              name="Full Name"
              type="text"
              required
              autoComplete="name"
              defaultValue={prefill?.full_name && prefill.full_name !== 'Unknown' ? prefill.full_name : ''}
              className={`mt-1.5 ${inputClass}`}
            />
          </div>

          <div>
            <label htmlFor="email" className={labelClass}>Email (optional)</label>
            <input
              id="email"
              name="Email Address"
              type="email"
              autoComplete="email"
              defaultValue={prefill?.email ?? ''}
              className={`mt-1.5 ${inputClass}`}
            />
          </div>

          <div>
            <label htmlFor="address" className={labelClass}>Job address</label>
            <input
              id="address"
              name="Full Address"
              type="text"
              required
              autoComplete="street-address"
              placeholder="123 Queen St W, Toronto"
              defaultValue={prefill?.address ?? ''}
              className={`mt-1.5 ${inputClass}`}
            />
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

          <QuotePhotoUpload onBusyChange={setPhotosBusy} />

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

          <SubmitButton disabled={photosBusy}>Get My Free Estimate</SubmitButton>
        </div>
      )}
    </form>
  );
}
