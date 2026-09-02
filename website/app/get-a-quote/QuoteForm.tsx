'use client';

import { useActionState, useMemo, useState, type ReactNode } from 'react';
import { SubmitButton } from '@/components/SubmitButton';
import { HoneypotField } from '@/components/HoneypotField';
import { CALLBACK_WINDOW, MATCH_WINDOW, successFollowUpCopy } from '@/lib/response-time';
import {
  composeFollowUpNotes,
  formDisplayScore,
  isPartialAddress,
  pickFormFollowUps,
  type FollowUpQuestion,
} from '@/lib/quote-confidence';
import { checkReturningClient, submitJobRequest, type QuoteFormState } from './actions';
import { QuoteConfidence } from './QuoteConfidence';
import { QuotePhotoUpload } from './QuotePhotoUpload';
import { QuoteVoiceInput } from './QuoteVoiceInput';

const initialQuoteFormState: QuoteFormState = { status: 'idle' };

const inputClass =
  'w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-foreground/40 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand';

const labelClass = 'block text-sm font-medium text-foreground';

const URGENCY_CHIPS = [
  { value: 'Not urgent', label: 'Not urgent' },
  { value: 'Somewhat urgent', label: 'This week' },
  { value: 'Emergency — needs immediate attention', label: 'Emergency' },
  { value: 'Not sure', label: 'Not sure' },
] as const;

const JOB_LENGTH_CHIPS = [
  { value: 'Quick job (under 3 hours)', label: 'Under 3 hours' },
  { value: 'Half a day', label: 'Half a day' },
  { value: 'A full day or more', label: 'A day or more' },
  { value: 'Not sure', label: 'Not sure' },
] as const;

const SAFETY_CHIPS = [
  { value: 'No', label: 'No' },
  { value: 'Yes', label: 'Yes' },
  { value: 'Not sure', label: 'Not sure' },
] as const;

type Step = 1 | 2 | 3;

export function QuoteForm() {
  const [state, formAction] = useActionState(submitJobRequest, initialQuoteFormState);

  const [step, setStep] = useState<Step>(1);
  const [stepError, setStepError] = useState<string | null>(null);

  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [urgency, setUrgency] = useState<string | null>(null);
  const [jobLength, setJobLength] = useState<string | null>(null);
  const [safety, setSafety] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [remember, setRemember] = useState(false);
  const [isReturning, setIsReturning] = useState(false);
  const [photosBusy, setPhotosBusy] = useState(false);
  const [photoCount, setPhotoCount] = useState(0);
  const [followUpAnswers, setFollowUpAnswers] = useState<Record<string, string>>({});
  const [lookupBusy, setLookupBusy] = useState(false);

  const formScore = formDisplayScore({
    photoCount,
    description,
    address: step >= 2 && address.trim() ? address : null,
    urgencySubmitted: urgency != null,
    jobSizeSubmitted: jobLength != null,
    safetySubmitted: safety != null,
  });
  const followUps = useMemo(
    () => pickFormFollowUps(description, formScore),
    [description, formScore],
  );
  const followUpNotes = composeFollowUpNotes(followUps, followUpAnswers);

  async function lookupPhone(value: string) {
    const trimmed = value.trim();
    if (trimmed.replace(/\D/g, '').length < 10) return;
    setLookupBusy(true);
    try {
      const match = await checkReturningClient(trimmed);
      if (!match.found) {
        setIsReturning(false);
        return;
      }
      setIsReturning(true);
      setRemember(true);
      if (!fullName && match.full_name && match.full_name !== 'Unknown') {
        setFullName(match.full_name);
      }
      if (!email && match.email) setEmail(match.email);
    } finally {
      setLookupBusy(false);
    }
  }

  function goNext() {
    if (step === 1) {
      if (!description.trim()) {
        setStepError('Describe what needs doing to continue.');
        return;
      }
      if (photosBusy) {
        setStepError('Wait for photos to finish uploading, or remove them.');
        return;
      }
    }
    if (step === 2 && !address.trim()) {
      setStepError('Enter the job address to continue.');
      return;
    }
    setStepError(null);
    setStep((s) => (s === 3 ? 3 : ((s + 1) as Step)));
  }

  function goBack() {
    setStepError(null);
    setStep((s) => (s === 1 ? 1 : ((s - 1) as Step)));
  }

  if (state.status === 'success') {
    const shownScore =
      typeof state.quote?.display_score === 'number' ? Math.min(99, state.quote.display_score) : undefined;
    return (
      <div className="rounded-2xl border border-brand/30 bg-brand/5 p-8">
        <h2 className="text-xl font-semibold text-foreground">You&apos;re all set!</h2>
        {typeof state.quote?.low === 'number' && typeof state.quote?.high === 'number' && (
          <div className="mt-2">
            <p className="text-3xl font-bold text-brand">
              ${state.quote.low} – ${state.quote.high}{' '}
              <span className="text-base font-normal text-foreground/60">CAD</span>
            </p>
            {state.quote.time_estimate?.label && (
              <p className="mt-1 text-sm text-foreground/70">{state.quote.time_estimate.label}</p>
            )}
          </div>
        )}
        {typeof shownScore === 'number' && (
          <QuoteConfidence
            score={shownScore}
            explanations={state.quote?.explanations ?? []}
            followUps={state.quote?.follow_up_questions ?? []}
          />
        )}
        <p className="mt-3 text-sm text-foreground/70">
          {successFollowUpCopy(state.quote?.offers_sent ?? 0)}
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
        if (photosBusy) {
          e.preventDefault();
          return;
        }
        if (step !== 3) {
          e.preventDefault();
          goNext();
          return;
        }
        if (!fullName.trim() || phone.replace(/\D/g, '').length < 10) {
          e.preventDefault();
          setStepError('Add your name and phone number so we can follow up.');
        }
      }}
      className="relative space-y-5"
    >
      <HoneypotField />
      <div>
        <p className="text-sm font-medium text-foreground">Step {step} of 3</p>
        <div className="mt-2 flex gap-1.5" aria-hidden="true">
          {([1, 2, 3] as const).map((n) => (
            <div
              key={n}
              className={`h-1.5 flex-1 rounded-full ${n <= step ? 'bg-accent' : 'bg-border'}`}
            />
          ))}
        </div>
      </div>

      {state.status === 'error' && (
        <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {state.message}
        </div>
      )}
      {stepError && (
        <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {stepError}
        </div>
      )}

      <input type="hidden" name="rememberClient" value={remember ? 'true' : 'false'} readOnly />
      <input type="hidden" name="Urgency" value={urgency ?? ''} readOnly />
      <input type="hidden" name="Job Length" value={jobLength ?? ''} readOnly />
      <input type="hidden" name="Safety" value={safety ?? ''} readOnly />
      <input type="hidden" name="Follow-up Notes" value={followUpNotes} readOnly />

      {/* Step 1 stays mounted so in-progress photo uploads are not discarded. */}
      <div className={step === 1 ? 'space-y-5' : 'hidden'}>
        <div>
          <div className="flex items-start justify-between gap-3">
            <label htmlFor="description" className={labelClass}>
              What&apos;s the job?
            </label>
            <QuoteVoiceInput
              onTranscript={(text) => {
                setDescription((prev) => {
                  const spoken = text.trim();
                  if (!spoken) return prev;
                  const existing = prev.trim();
                  return existing ? `${existing} ${spoken}` : spoken;
                });
                setStepError(null);
              }}
            />
          </div>
          <textarea
            id="description"
            name="Detailed Job Description"
            rows={4}
            placeholder="e.g. Kitchen outlet stopped working and sparks a little when I plug things in"
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              setStepError(null);
            }}
            className={`mt-1.5 ${inputClass}`}
          />
          <p className="mt-1.5 text-xs text-foreground/55">
            The more detail you give — how many outlets/fixtures, how long it&apos;s been happening,
            what you&apos;ve already tried — the more accurate your estimate will be.
          </p>
        </div>
        <QuotePhotoUpload onBusyChange={setPhotosBusy} onCountChange={setPhotoCount} />
      </div>

      {step >= 2 && (
        <div className={step === 2 ? 'space-y-5' : 'hidden'}>
          <div>
            <label htmlFor="address" className={labelClass}>
              Where is the job?
            </label>
            <input
              id="address"
              name="Full Address"
              type="text"
              autoComplete="street-address"
              placeholder="123 Queen St W, Toronto"
              value={address}
              onChange={(e) => {
                setAddress(e.target.value);
                setStepError(null);
              }}
              className={`mt-1.5 ${inputClass}`}
            />
            {isPartialAddress(address) && (
              <p className="mt-1.5 text-xs text-foreground/55">
                Add the street number and unit (if it&apos;s a condo) for a more accurate estimate.
              </p>
            )}
          </div>
          <fieldset>
            <legend className={labelClass}>How urgent is this?</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {URGENCY_CHIPS.map((chip) => (
                <Chip
                  key={chip.value}
                  selected={urgency === chip.value}
                  onSelect={() => setUrgency(chip.value)}
                >
                  {chip.label}
                </Chip>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className={labelClass}>Roughly how big is the job?</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {JOB_LENGTH_CHIPS.map((chip) => (
                <Chip
                  key={chip.value}
                  selected={jobLength === chip.value}
                  onSelect={() => setJobLength(chip.value)}
                >
                  {chip.label}
                </Chip>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className={labelClass}>Is this affecting safety or causing damage?</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {SAFETY_CHIPS.map((chip) => (
                <Chip
                  key={chip.value}
                  selected={safety === chip.value}
                  onSelect={() => setSafety(chip.value)}
                >
                  {chip.label}
                </Chip>
              ))}
            </div>
          </fieldset>
        </div>
      )}

      {(step === 1 || step === 2) && followUps.length > 0 && (
        <FollowUpFields
          questions={followUps}
          answers={followUpAnswers}
          onAnswer={(id, value) => setFollowUpAnswers((prev) => ({ ...prev, [id]: value }))}
        />
      )}

      {step >= 3 && (
        <div className="space-y-5">
          {isReturning && (
            <div className="rounded-lg border border-brand/30 bg-brand/5 px-4 py-3 text-sm text-foreground/80">
              Welcome back! We&apos;ve filled in what we remembered.
            </div>
          )}
          <div>
            <label htmlFor="full-name" className={labelClass}>
              Full name
            </label>
            <input
              id="full-name"
              name="Full Name"
              type="text"
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={`mt-1.5 ${inputClass}`}
            />
          </div>
          <div>
            <label htmlFor="phone-step" className={labelClass}>
              Phone number
            </label>
            <input
              id="phone-step"
              name="Phone Number"
              type="tel"
              autoComplete="tel"
              placeholder="(647) 555-0199"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onBlur={() => void lookupPhone(phone)}
              className={`mt-1.5 ${inputClass}`}
            />
            {lookupBusy && (
              <p className="mt-1.5 text-xs text-foreground/50">Checking if we have you on file…</p>
            )}
          </div>
          <div>
            <label htmlFor="email" className={labelClass}>
              Email (optional)
            </label>
            <input
              id="email"
              name="Email Address"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`mt-1.5 ${inputClass}`}
            />
          </div>
          <label className="flex items-start gap-2 text-sm text-foreground/80">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 rounded"
            />
            <span>Save my info for next time — we&apos;ll remember you if you request another job.</span>
          </label>
          <p className="text-xs text-foreground/50">
            {MATCH_WINDOW} {CALLBACK_WINDOW}
          </p>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {step > 1 && (
          <button
            type="button"
            onClick={goBack}
            className="rounded-full border border-border px-6 py-3 text-sm font-semibold text-foreground transition hover:border-brand hover:text-brand"
          >
            Back
          </button>
        )}
        {step < 3 ? (
          <button
            type="button"
            onClick={goNext}
            className="w-full rounded-full bg-accent px-6 py-3 text-sm font-semibold text-inverse transition hover:bg-accent-dark sm:w-auto"
          >
            Continue
          </button>
        ) : (
          <SubmitButton disabled={photosBusy}>Get My Free Estimate</SubmitButton>
        )}
      </div>
    </form>
  );
}

function Chip({
  selected,
  onSelect,
  children,
}: {
  selected: boolean;
  onSelect: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
        selected
          ? 'bg-inverse text-inverse-foreground'
          : 'border border-border bg-background text-foreground/80 hover:border-brand'
      }`}
    >
      {children}
    </button>
  );
}

function FollowUpFields({
  questions,
  answers,
  onAnswer,
}: {
  questions: FollowUpQuestion[];
  answers: Record<string, string>;
  onAnswer: (id: string, value: string) => void;
}) {
  return (
    <div className="space-y-3 rounded-xl border border-border bg-surface px-4 py-4">
      <p className="text-sm font-medium text-foreground">
        A couple of extras would tighten this estimate (optional)
      </p>
      {questions.map((q) => (
        <label key={q.id} className="block">
          <span className="text-sm text-foreground/80">{q.prompt}</span>
          <input
            type="text"
            value={answers[q.id] ?? ''}
            onChange={(e) => onAnswer(q.id, e.target.value)}
            className={`mt-1.5 ${inputClass}`}
          />
        </label>
      ))}
    </div>
  );
}
