'use client';

import { useActionState, useCallback, useEffect, useRef, useState } from 'react';
import { SubmitButton } from '@/components/SubmitButton';
import { reverseGeocode } from '@/lib/reverse-geocode';
import { checkReturningClient, initialQuoteFormState, submitJobRequest } from './actions';

const inputClass =
  'w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-foreground/40 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand';

const labelClass = 'block text-sm font-medium text-foreground';

interface Prefill {
  full_name?: string;
  email?: string;
  address?: string;
}

type PhoneStage = 'entry' | 'checking' | 'ask-consent';

// 'prompting'/'suggested'/'declined'/'unavailable' mirror the browser
// Geolocation API's actual outcomes; 'idle' means "not asked yet" (still
// on step 1) or "user cleared the suggestion and is typing their own."
type LocationStatus = 'idle' | 'prompting' | 'suggested' | 'declined' | 'unavailable';

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

  // Address is controlled (not defaultValue) specifically so a
  // geolocation suggestion can fill it in after the field has already
  // rendered — a returning-client prefill still wins if one exists;
  // geolocation only ever fills a field that's still empty (see the
  // effect below and addressSource state).
  type AddressSource = 'empty' | 'prefill' | 'geolocation' | 'user';
  const [address, setAddress] = useState('');
  const [addressSource, setAddressSourceState] = useState<AddressSource>('empty');
  // Mirrors addressSource for reads inside the geolocation effect's async
  // callback below, which can fire many seconds after the effect ran (the
  // browser's permission prompt has no time limit) — by then, a closure
  // over the `addressSource` state variable would be stale if the user
  // had started typing in the meantime, and could overwrite their input
  // with a late-arriving geolocation guess. A ref's `.current` is always
  // current when read, so keeping this in lockstep via setAddressSource
  // (below) avoids that. Never read during render — that's what the
  // `addressSource` state above is for.
  const addressSourceRef = useRef<AddressSource>('empty');
  const setAddressSource = useCallback((value: AddressSource) => {
    addressSourceRef.current = value;
    setAddressSourceState(value);
  }, []);
  const addressInputRef = useRef<HTMLInputElement>(null);
  const [locationStatus, setLocationStatus] = useState<LocationStatus>('idle');
  const [suggestedAddress, setSuggestedAddress] = useState<string | null>(null);
  const geolocationRequestedRef = useRef(false);

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
      if (match.address) {
        setAddress(match.address);
        setAddressSource('prefill');
      }
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

  // Only asks for location once step 2 is actually reached, not on
  // initial page load — a location permission prompt before someone's
  // even entered their phone number reads as premature. Runs once per
  // visit to step 2 (geolocationRequestedRef), and a returning-client
  // address (addressSource === 'prefill') always wins over a guess.
  useEffect(() => {
    if (step !== 'details' || geolocationRequestedRef.current) return;
    geolocationRequestedRef.current = true;
    if (addressSourceRef.current === 'prefill') return;

    let cancelled = false;

    // The state updates below all happen inside this callback rather
    // than directly in the effect body (even the "not supported at
    // all" early exit) — react-hooks/set-state-in-effect flags setState
    // calls that run synchronously during the effect's own execution,
    // even one-time capability checks like this one.
    const requestLocation = () => {
      if (cancelled) return;

      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        setLocationStatus('unavailable');
        return;
      }

      setLocationStatus('prompting');

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
          if (addressSourceRef.current === 'empty') {
            setAddress(suggestion);
            setAddressSource('geolocation');
          }
        },
        (err) => {
          if (cancelled) return;
          setLocationStatus(err.code === err.PERMISSION_DENIED ? 'declined' : 'unavailable');
        },
        { enableHighAccuracy: false, timeout: 10_000, maximumAge: 5 * 60_000 },
      );
    };

    queueMicrotask(requestLocation);

    return () => {
      cancelled = true;
    };
  }, [step, setAddressSource]);

  function clearSuggestedAddress() {
    setAddressSource('user');
    setSuggestedAddress(null);
    setAddress('');
    setLocationStatus('idle');
    requestAnimationFrame(() => addressInputRef.current?.focus());
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
    <form action={formAction} className="space-y-5">
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
            {locationStatus === 'prompting' && (
              <p className="mb-1.5 rounded-lg border border-border bg-surface px-4 py-3 text-xs text-foreground/65">
                Your browser may ask for location so we can suggest a starting address. That&apos;s
                optional — you can always type the job address yourself.
              </p>
            )}
            {locationStatus === 'declined' && (
              <p className="mb-1.5 rounded-lg border border-border bg-surface px-4 py-3 text-xs text-foreground/65">
                No problem — we don&apos;t need location access. Type the job address below.
              </p>
            )}
            <input
              ref={addressInputRef}
              id="address"
              name="Full Address"
              type="text"
              required
              autoComplete="street-address"
              placeholder="123 Queen St W, Toronto"
              value={address}
              onChange={(e) => {
                setAddress(e.target.value);
                setAddressSource('user');
              }}
              className={`mt-1.5 ${inputClass}`}
            />
            {locationStatus === 'suggested' && suggestedAddress && addressSource === 'geolocation' && (
              <>
                <p className="mt-1.5 text-xs text-foreground/55">
                  Suggested from your current location. Edit freely — this isn&apos;t locked.
                </p>
                <button
                  type="button"
                  onClick={clearSuggestedAddress}
                  className="mt-1 text-sm font-semibold text-brand hover:underline"
                >
                  This isn&apos;t where the job is
                </button>
              </>
            )}
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
        </div>
      )}
    </form>
  );
}
