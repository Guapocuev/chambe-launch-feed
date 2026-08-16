'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { FormErrorBanner } from '@/components/FormFields';
import { FormStepProgress } from '@/components/FormStepProgress';
import { FormTrustNote } from '@/components/FormTrustNote';
import { CONTRACTOR_FOLLOWUP, QuoteSuccessTimeline } from '@/components/PostSubmitTimeline';
import { SubmitButton } from '@/components/SubmitButton';
import { useFormAnalytics } from '@/hooks/useFormAnalytics';
import {
  formatPhoneInput,
  isValidEmail,
  isValidName,
  isValidPhone,
} from '@/lib/phone';
import { reverseGeocode } from '@/lib/reverse-geocode';
import { submitJobRequest } from './actions';
import { initialQuoteFormState } from './quote-form-state';

type LocationStatus = 'prompting' | 'suggested' | 'declined' | 'unavailable' | 'idle';

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

function FieldError({ id, show, children }: { id: string; show: boolean; children: string }) {
  if (!show) return null;
  return (
    <p id={id} className="mt-1.5 text-xs text-red-600" role="alert">
      {children}
    </p>
  );
}

export function QuoteForm() {
  const [state, formAction] = useActionState(submitJobRequest, initialQuoteFormState);
  const { markStarted } = useFormAnalytics('quote', state.status);
  const [step, setStep] = useState(1);
  const [values, setValues] = useState<FormValues>(INITIAL);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [locationStatus, setLocationStatus] = useState<LocationStatus>('prompting');
  const [suggestedAddress, setSuggestedAddress] = useState<string | null>(null);
  const addressInputRef = useRef<HTMLInputElement>(null);
  const addressEditedRef = useRef(false);

  const set = (key: keyof FormValues, value: string) => {
    if (key === 'address') addressEditedRef.current = true;
    setValues((v) => ({ ...v, [key]: value }));
  };

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setLocationStatus('unavailable');
      return;
    }

    let cancelled = false;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const suggestion = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
        if (cancelled) return;
        if (!suggestion) {
          setLocationStatus('unavailable');
          return;
        }
        setSuggestedAddress(suggestion);
        setLocationStatus('suggested');
        if (!addressEditedRef.current) {
          setValues((v) => (v.address.trim() ? v : { ...v, address: suggestion }));
        }
      },
      (err) => {
        if (cancelled) return;
        setLocationStatus(err.code === err.PERMISSION_DENIED ? 'declined' : 'unavailable');
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 5 * 60_000 },
    );

    return () => {
      cancelled = true;
    };
  }, []);

  const clearSuggestedAddress = () => {
    addressEditedRef.current = true;
    setSuggestedAddress(null);
    set('address', '');
    setLocationStatus('idle');
    requestAnimationFrame(() => addressInputRef.current?.focus());
  };

  const markTouched = (...keys: string[]) => {
    setTouched((t) => {
      const next = { ...t };
      for (const key of keys) next[key] = true;
      return next;
    });
  };

  const validateStep = (s: number): boolean => {
    if (s === 1) {
      markTouched('description');
      return Boolean(values.description.trim());
    }
    if (s === 2) {
      markTouched('address');
      return Boolean(values.address.trim());
    }
    if (s === 3) {
      markTouched('fullName', 'phone', 'email');
      return isValidName(values.fullName) && isValidPhone(values.phone) && isValidEmail(values.email);
    }
    return true;
  };

  const goNext = () => {
    if (validateStep(step)) setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  };

  const goBack = () => {
    setStep((s) => Math.max(s - 1, 1));
  };

  const descriptionError = Boolean(touched.description && !values.description.trim());
  const addressError = Boolean(touched.address && !values.address.trim());
  const nameError = Boolean(touched.fullName && !isValidName(values.fullName));
  const phoneError = Boolean(touched.phone && !isValidPhone(values.phone));
  const emailError = Boolean(touched.email && !isValidEmail(values.email));
  const hasEstimate =
    typeof state.quote?.low === 'number' && typeof state.quote?.high === 'number';

  if (state.status === 'success') {
    return (
      <div className="rounded-2xl border border-accent/30 bg-accent/5 p-8">
        <h2 className="text-xl font-semibold text-foreground">You&apos;re all set!</h2>
        {hasEstimate && (
          <p className="mt-2 text-3xl font-bold text-accent">
            ${state.quote?.low} – ${state.quote?.high}{' '}
            <span className="text-base font-normal text-foreground/60">CAD</span>
          </p>
        )}
        <p className="mt-3 text-sm text-foreground/70">
          {state.quote?.offers_sent
            ? `We've matched your job with ${state.quote.offers_sent} nearby contractor${state.quote.offers_sent === 1 ? '' : 's'}. ${CONTRACTOR_FOLLOWUP}`
            : `We've logged your job and are lining up a contractor match. ${CONTRACTOR_FOLLOWUP}`}
        </p>
        <QuoteSuccessTimeline hasEstimate={hasEstimate} />
      </div>
    );
  }

  if (state.status === 'pending_retry') {
    return (
      <div className="rounded-2xl border border-accent/30 bg-accent/5 p-8">
        <h2 className="text-xl font-semibold text-foreground">Got it!</h2>
        <p className="mt-2 text-sm text-foreground/70">{state.message}</p>
        <QuoteSuccessTimeline hasEstimate={false} />
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5" onFocusCapture={markStarted}>
      <FormStepProgress current={step} />

      {state.status === 'error' && state.message && <FormErrorBanner message={state.message} />}

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
              onBlur={() => markTouched('description')}
              placeholder="e.g. Kitchen outlet stopped working and sparks a little when I plug things in"
              aria-invalid={descriptionError}
              aria-describedby={descriptionError ? 'description-error' : undefined}
              className={`mt-1.5 ${fieldClass(descriptionError)}`}
            />
            <FieldError id="description-error" show={descriptionError}>
              Please describe what needs doing.
            </FieldError>
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
          {locationStatus === 'prompting' && (
            <p className="rounded-lg border border-border bg-surface px-4 py-3 text-xs text-foreground/65">
              Your browser may ask for location so we can suggest a starting address. That is
              optional — you can always type the job address yourself.
            </p>
          )}
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
              We use this to match you with a contractor in your neighbourhood. Location is only
              a suggestion — type the real job address if this isn&apos;t it.
            </p>
          </div>
          {locationStatus === 'prompting' && (
            <p className="rounded-lg border border-border bg-surface px-4 py-3 text-xs text-foreground/65">
              Asking for your current location to suggest a starting address. Decline anytime and
              type it instead.
            </p>
          )}
          {locationStatus === 'declined' && (
            <p className="rounded-lg border border-border bg-surface px-4 py-3 text-xs text-foreground/65">
              No problem — we don&apos;t need location access. Type the job address below.
            </p>
          )}
          {locationStatus === 'unavailable' && (
            <p className="rounded-lg border border-border bg-surface px-4 py-3 text-xs text-foreground/65">
              We couldn&apos;t detect your location. Type the job address below.
            </p>
          )}
          <div>
            <label htmlFor="address" className={labelClass}>
              Job address
            </label>
            <input
              ref={addressInputRef}
              id="address"
              type="text"
              required
              autoComplete="street-address"
              value={values.address}
              onChange={(e) => set('address', e.target.value)}
              onBlur={() => markTouched('address')}
              placeholder="123 Queen St W, Toronto"
              aria-invalid={addressError}
              aria-describedby={
                [addressError ? 'address-error' : null, 'address-hint'].filter(Boolean).join(' ') ||
                undefined
              }
              className={`mt-1.5 ${fieldClass(addressError)}`}
            />
            <p id="address-hint" className="mt-1.5 text-xs text-foreground/55">
              {locationStatus === 'suggested' && suggestedAddress
                ? 'Suggested from your current location. Edit freely — this is not locked.'
                : 'Type or edit the address where the work will happen.'}
            </p>
            {locationStatus === 'suggested' && suggestedAddress && (
              <button
                type="button"
                onClick={clearSuggestedAddress}
                className="mt-2 text-sm font-semibold text-brand hover:underline"
              >
                This isn&apos;t where the job is
              </button>
            )}
            <FieldError id="address-error" show={addressError}>
              Please enter the job address.
            </FieldError>
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
              onBlur={() => markTouched('fullName')}
              aria-invalid={nameError}
              aria-describedby={nameError ? 'full-name-error' : undefined}
              className={`mt-1.5 ${fieldClass(nameError)}`}
            />
            <FieldError id="full-name-error" show={nameError}>
              Please enter your full name.
            </FieldError>
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
                onBlur={() => markTouched('phone')}
                placeholder="(647) 555-0199"
                aria-invalid={phoneError}
                aria-describedby={phoneError ? 'phone-error' : undefined}
                className={`mt-1.5 ${fieldClass(phoneError)}`}
              />
              <FieldError id="phone-error" show={phoneError}>
                Please enter a valid 10-digit phone number.
              </FieldError>
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
                onBlur={() => markTouched('email')}
                aria-invalid={emailError}
                aria-describedby={emailError ? 'email-error' : undefined}
                className={`mt-1.5 ${fieldClass(emailError)}`}
              />
              <FieldError id="email-error" show={emailError}>
                Please enter a valid email address.
              </FieldError>
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
