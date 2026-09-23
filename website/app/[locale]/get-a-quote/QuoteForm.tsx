'use client';

import { useActionState, useMemo, useRef, useState, type ReactNode } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { MARKETING_CTA } from '@/lib/marketing-cta';
import { SubmitButton } from '@/components/SubmitButton';
import { HoneypotField } from '@/components/HoneypotField';
import { CALLBACK_MINUTES, CONTRACTOR_ACCEPT_MINUTES } from '@/lib/response-time';
import { formatCad } from '@/lib/format-cad';
import {
  AREA_SQFT_QUESTION,
  AREA_SQFT_QUESTION_ID,
  AREA_SQFT_SKIPPED,
  composeFollowUpNotes,
  formDisplayScore,
  isPartialAddress,
  parseAreaSqftAnswer,
  parseAreaSqftFromDescription,
  pickFormFollowUps,
  shouldPromptAreaSqft,
  type FollowUpQuestion,
} from '@/lib/quote-confidence';
import { checkReturningClient, submitJobRequest, type QuoteFormState } from './actions';
import { QuoteConfidence } from './QuoteConfidence';
import { QuotePhotoUpload } from './QuotePhotoUpload';
import { QuoteSqftReference } from './QuoteSqftReference';
import { QuoteVoiceInput } from './QuoteVoiceInput';

const initialQuoteFormState: QuoteFormState = { status: 'idle' };

const inputClass =
  'w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-foreground/40 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand';

const labelClass = 'block text-sm font-medium text-foreground';

const URGENCY_CHIPS = [
  { value: 'Not urgent', labelKey: 'notUrgent' },
  { value: 'Somewhat urgent', labelKey: 'thisWeek' },
  { value: 'Emergency — needs immediate attention', labelKey: 'emergency' },
  { value: 'Not sure', labelKey: 'notSure' },
] as const;

const JOB_LENGTH_CHIPS = [
  { value: 'Quick job (under 3 hours)', labelKey: 'under3h' },
  { value: 'Half a day', labelKey: 'halfDay' },
  { value: 'A full day or more', labelKey: 'fullDay' },
  { value: 'Not sure', labelKey: 'notSure' },
] as const;

const SAFETY_CHIPS = [
  { value: 'No', labelKey: 'no' },
  { value: 'Yes', labelKey: 'yes' },
  { value: 'Not sure', labelKey: 'notSure' },
] as const;

function formatHoursPart(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function timeEstimateCopy(
  t: (key: string, values?: Record<string, string>) => string,
  estimate: { hours_low: number | null; hours_high: number | null } | null | undefined,
  score: number | undefined,
): string {
  if (!estimate || estimate.hours_low == null || estimate.hours_high == null) {
    return t('timeConfirmedOnSite');
  }
  const scoreValue = score ?? 0;
  const prefix = scoreValue >= 80 ? t('timeAbout') : scoreValue >= 70 ? t('timeRoughly') : t('timeLikely');
  const values = {
    prefix,
    low: formatHoursPart(estimate.hours_low),
    high: formatHoursPart(estimate.hours_high),
  };
  return scoreValue >= 70 ? t('timeHoursOnSite', values) : t('timeHoursAfterLook', values);
}

type Step = 1 | 2 | 3;

export function QuoteForm() {
  const t = useTranslations('Quote');
  const tTime = useTranslations('ResponseTime');
  const locale = useLocale();
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
  const showAreaSqft = shouldPromptAreaSqft(description, followUpAnswers[AREA_SQFT_QUESTION_ID]);
  const areaSqftValue =
    parseAreaSqftAnswer(followUpAnswers[AREA_SQFT_QUESTION_ID]) ??
    parseAreaSqftFromDescription(description);

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

  function liveValue(id: string, fallback: string): string {
    if (typeof document === 'undefined') return fallback;
    const el = document.getElementById(id);
    if (el && 'value' in el && typeof (el as HTMLInputElement).value === 'string') {
      return (el as HTMLInputElement).value;
    }
    return fallback;
  }

  function goNext() {
    if (step === 1) {
      const liveDescription = liveValue('description', description);
      if (liveDescription !== description) setDescription(liveDescription);
      if (!liveDescription.trim()) {
        setStepError(t('needDescription'));
        return;
      }
      if (photosBusy) {
        setStepError(t('waitPhotos'));
        return;
      }
    }
    if (step === 2) {
      const liveAddress = liveValue('address', address);
      if (liveAddress !== address) setAddress(liveAddress);
      if (!liveAddress.trim()) {
        setStepError(t('needAddress'));
        return;
      }
    }
    setStepError(null);
    setStep((s) => (s === 3 ? 3 : ((s + 1) as Step)));
  }

  const goNextRef = useRef(goNext);
  goNextRef.current = goNext;

  function goBack() {
    setStepError(null);
    setStep((s) => (s === 1 ? 1 : ((s - 1) as Step)));
  }

  if (state.status === 'success') {
    const shownScore =
      typeof state.quote?.display_score === 'number' ? Math.min(99, state.quote.display_score) : undefined;
    return (
      <div className="rounded-2xl border border-brand/30 bg-brand/5 p-8">
        <h2 className="text-xl font-semibold text-foreground">{t('successTitle')}</h2>
        {typeof state.quote?.low === 'number' && typeof state.quote?.high === 'number' && (
          <div className="mt-2">
            <p className="text-3xl font-bold text-brand">
              {`${formatCad(state.quote.low, locale)} – ${formatCad(state.quote.high, locale)}`}
            </p>
            <p className="mt-1 text-sm text-foreground/70">
              {timeEstimateCopy(t, state.quote.time_estimate, shownScore)}
            </p>
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
          {`${
            (state.quote?.offers_sent ?? 0) > 0
              ? t('matched', { count: state.quote?.offers_sent ?? 0 })
              : t('logged')
          } ${tTime('matchWindow', { minutes: CONTRACTOR_ACCEPT_MINUTES })} ${tTime('callbackWindow', {
            hours: tTime('businessHours'),
            minutes: CALLBACK_MINUTES,
          })}`}
        </p>
      </div>
    );
  }

  if (state.status === 'pending_retry') {
    return (
      <div className="rounded-2xl border border-accent/30 bg-accent/5 p-8">
        <h2 className="text-xl font-semibold text-foreground">{t('pendingTitle')}</h2>
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
          setStepError(t('needContact'));
        }
      }}
      className="relative space-y-5"
    >
      <HoneypotField />
      <div>
        <p className="text-sm font-medium text-foreground">{t('stepOf', { step })}</p>
        <div className="mt-2 flex gap-1.5" aria-hidden="true">
          {([1, 2, 3] as const).map((n) => (
            <div
              key={n}
              className={`h-1.5 flex-1 rounded-full ${n <= step ? 'bg-accent' : 'bg-border'}`}
            />
          ))}
        </div>
        <div className="mt-2">
          <QuoteConfidence score={formScore} explanations={[]} followUps={[]} compact />
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
      <input type="hidden" name="area_sqft" value={areaSqftValue ?? ''} readOnly />

      {/* Step 1 stays mounted so in-progress photo uploads are not discarded. */}
      <div className={step === 1 ? 'space-y-5' : 'hidden'}>
        <div>
          <div className="flex items-start justify-between gap-3">
            <label htmlFor="description" className={labelClass}>
              {t('jobLabel')}
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
            placeholder={t('jobPlaceholder')}
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              setStepError(null);
            }}
            className={`mt-1.5 ${inputClass}`}
          />
          <p className="mt-1.5 text-xs text-foreground/55">
            {t('jobHelp')}
          </p>
        </div>
        <QuotePhotoUpload onBusyChange={setPhotosBusy} onCountChange={setPhotoCount} />
      </div>

      {step >= 2 && (
        <div className={step === 2 ? 'space-y-5' : 'hidden'}>
          <div>
            <label htmlFor="address" className={labelClass}>
              {t('addressLabel')}
            </label>
            <input
              id="address"
              name="Full Address"
              type="text"
              autoComplete="street-address"
              placeholder={t('addressPlaceholder')}
              value={address}
              onChange={(e) => {
                setAddress(e.target.value);
                setStepError(null);
              }}
              className={`mt-1.5 ${inputClass}`}
            />
            {isPartialAddress(address) && (
              <p className="mt-1.5 text-xs text-foreground/55">
                {t('partialAddress')}
              </p>
            )}
          </div>
          <fieldset>
            <legend className={labelClass}>{t('urgency')}</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {URGENCY_CHIPS.map((chip) => (
                <Chip
                  key={chip.value}
                  selected={urgency === chip.value}
                  onSelect={() => setUrgency(chip.value)}
                >
                  {t(chip.labelKey)}
                </Chip>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className={labelClass}>{t('jobLength')}</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {JOB_LENGTH_CHIPS.map((chip) => (
                <Chip
                  key={chip.value}
                  selected={jobLength === chip.value}
                  onSelect={() => setJobLength(chip.value)}
                >
                  {t(chip.labelKey)}
                </Chip>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className={labelClass}>{t('safety')}</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {SAFETY_CHIPS.map((chip) => (
                <Chip
                  key={chip.value}
                  selected={safety === chip.value}
                  onSelect={() => setSafety(chip.value)}
                >
                  {t(chip.labelKey)}
                </Chip>
              ))}
            </div>
          </fieldset>
        </div>
      )}

      {(step === 1 || step === 2) && showAreaSqft && (
        <AreaSqftField
          value={followUpAnswers[AREA_SQFT_QUESTION_ID] ?? ''}
          onChange={(value) =>
            setFollowUpAnswers((prev) => ({ ...prev, [AREA_SQFT_QUESTION_ID]: value }))
          }
          onSkip={() =>
            setFollowUpAnswers((prev) => ({ ...prev, [AREA_SQFT_QUESTION_ID]: AREA_SQFT_SKIPPED }))
          }
        />
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
              {t('welcomeBack')}
            </div>
          )}
          <div>
            <label htmlFor="full-name" className={labelClass}>
              {t('name')}
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
              {t('phone')}
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
              <p className="mt-1.5 text-xs text-foreground/50">{t('checkingFile')}</p>
            )}
          </div>
          <div>
            <label htmlFor="email" className={labelClass}>
              {t('email')}
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
            <span>{t('rememberLong')}</span>
          </label>
          <p className="text-xs text-foreground/50">
            {tTime('matchWindow', { minutes: CONTRACTOR_ACCEPT_MINUTES })}{' '}
            {tTime('callbackWindow', { hours: tTime('businessHours'), minutes: CALLBACK_MINUTES })}
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
            {t('back')}
          </button>
        )}
        {step < 3 ? (
          <button
            type="button"
            onClick={goNext}
            ref={(node) => {
              if (!node || node.dataset.bound === '1') return;
              node.dataset.bound = '1';
              node.addEventListener(
                'click',
                (event) => {
                  event.preventDefault();
                  goNextRef.current();
                },
                true,
              );
            }}
            className={`w-full sm:w-auto ${MARKETING_CTA}`}
          >
            {t('continue')}
          </button>
        ) : (
          <SubmitButton disabled={photosBusy}>{t('submit')}</SubmitButton>
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

function AreaSqftField({
  value,
  onChange,
  onSkip,
}: {
  value: string;
  onChange: (value: string) => void;
  onSkip: () => void;
}) {
  const t = useTranslations('Quote');
  const tFollow = useTranslations('FollowUps');
  return (
    <div className="space-y-3 rounded-xl border border-border bg-surface px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <label htmlFor="area-sqft" className="block min-w-0">
          <span className="text-sm font-medium text-foreground">{tFollow('area_sqft')}</span>
        </label>
        <button
          type="button"
          onClick={onSkip}
          className="shrink-0 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-foreground/80 transition hover:border-brand hover:text-brand"
        >
          {t('skipUnsure')}
        </button>
      </div>
      <input
        id="area-sqft"
        type="text"
        inputMode="numeric"
        placeholder={t('areaPlaceholder')}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
      />
      <QuoteSqftReference />
    </div>
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
  const t = useTranslations('Quote');
  const tFollow = useTranslations('FollowUps');
  return (
    <div className="space-y-3 rounded-xl border border-border bg-surface px-4 py-4">
      <p className="text-sm font-medium text-foreground">
        {t('extrasTitle')}
      </p>
      {questions.map((q) => (
        <label key={q.id} className="block">
          <span className="text-sm text-foreground/80">{tFollow(q.id)}</span>
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
