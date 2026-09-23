'use client';

import { useActionState, useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { MARKETING_CTA } from '@/lib/marketing-cta';
import { SubmitButton } from '@/components/SubmitButton';
import { HoneypotField } from '@/components/HoneypotField';
import { initialApplyFormState, submitContractorApplication } from './actions';

const inputClass =
  'w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-foreground/40 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand';

const labelClass = 'block text-sm font-medium text-foreground';

const TRADES = ['electrical', 'plumbing', 'carpentry'] as const;

type Step = 1 | 2;

export function ApplyForm() {
  const t = useTranslations('Apply');
  const tGallery = useTranslations('Gallery');
  const tTime = useTranslations('ResponseTime');
  const [state, formAction] = useActionState(submitContractorApplication, initialApplyFormState);
  const [step, setStep] = useState<Step>(1);
  const [stepError, setStepError] = useState<string | null>(null);
  const [trades, setTrades] = useState<string[]>([]);
  const [serviceArea, setServiceArea] = useState('');
  const [years, setYears] = useState('');
  const [licensed, setLicensed] = useState<'yes' | 'no' | ''>('');
  const [licenceNumber, setLicenceNumber] = useState('');
  const [insured, setInsured] = useState<'yes' | 'no' | ''>('');
  const [wsib, setWsib] = useState<'yes' | 'no' | ''>('');
  const [wsibNumber, setWsibNumber] = useState('');

  function toggleTrade(value: string) {
    setTrades((current) =>
      current.includes(value) ? current.filter((t) => t !== value) : [...current, value],
    );
    setStepError(null);
  }

  function goNext() {
    if (trades.length === 0) {
      setStepError(t('needTrade'));
      return;
    }
    if (!serviceArea.trim()) {
      setStepError(t('needArea'));
      return;
    }
    if (years.trim() === '') {
      setStepError(t('needYears'));
      return;
    }
    setStepError(null);
    setStep(2);
  }

  if (state.status === 'success') {
    return (
      <div className="rounded-2xl border border-brand/30 bg-brand/5 p-8">
        <h2 className="text-xl font-semibold text-foreground">{t('received')}</h2>
        <p className="mt-2 text-sm text-foreground/70">
          {tTime('applicantWindow', { callback: tTime('applicantCallback') })}
        </p>
        {state.contact?.phone && (
          <p className="mt-2 text-sm text-foreground/70">
            {state.contact.email
              ? t('followUpBoth', { phone: state.contact.phone, email: state.contact.email })
              : t('followUpPhone', { phone: state.contact.phone })}
          </p>
        )}
      </div>
    );
  }

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (step !== 2) {
          e.preventDefault();
          goNext();
          return;
        }
        if (!licensed || !insured || !wsib) {
          e.preventDefault();
          setStepError(t('needCompliance'));
        }
      }}
      className="relative space-y-5"
    >
      <HoneypotField />
      <div>
        <p className="text-sm font-medium text-foreground">{t('stepOf', { step })}</p>
        <div className="mt-2 flex gap-1.5" aria-hidden="true">
          {([1, 2] as const).map((n) => (
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

      {trades.map((trade) => (
        <input key={trade} type="hidden" name="trade" value={trade} />
      ))}
      <input type="hidden" name="licensed" value={licensed} readOnly />
      <input type="hidden" name="licence_number" value={licenceNumber} readOnly />
      <input type="hidden" name="insured" value={insured} readOnly />
      <input type="hidden" name="wsib" value={wsib} readOnly />
      <input type="hidden" name="wsib_number" value={wsibNumber} readOnly />

      <div className={step === 1 ? 'space-y-5' : 'hidden'}>
        <fieldset>
          <legend className={labelClass}>{t('trades')}</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {TRADES.map((trade) => (
              <Chip
                key={trade}
                selected={trades.includes(trade)}
                onSelect={() => toggleTrade(trade)}
              >
                {tGallery(trade)}
              </Chip>
            ))}
          </div>
        </fieldset>
        <div>
          <label htmlFor="service_area" className={labelClass}>
            {t('serviceArea')}
          </label>
          <input
            id="service_area"
            name="service_area"
            type="text"
            placeholder={t('servicePlaceholder')}
            value={serviceArea}
            onChange={(e) => {
              setServiceArea(e.target.value);
              setStepError(null);
            }}
            className={`mt-1.5 ${inputClass}`}
          />
        </div>
        <div>
          <label htmlFor="years_experience" className={labelClass}>
            {t('years')}
          </label>
          <input
            id="years_experience"
            name="years_experience"
            type="number"
            min="0"
            step="1"
            value={years}
            onChange={(e) => {
              setYears(e.target.value);
              setStepError(null);
            }}
            className={`mt-1.5 ${inputClass}`}
          />
        </div>
      </div>

      {step >= 2 && (
        <div className="space-y-5">
          <fieldset>
            <legend className={labelClass}>{t('licensed')}</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              <Chip selected={licensed === 'yes'} onSelect={() => setLicensed('yes')}>
                {t('yes')}
              </Chip>
              <Chip selected={licensed === 'no'} onSelect={() => setLicensed('no')}>
                {t('no')}
              </Chip>
            </div>
            {licensed === 'yes' && (
              <input
                type="text"
                placeholder={t('licenceNumber')}
                value={licenceNumber}
                onChange={(e) => setLicenceNumber(e.target.value)}
                className={`mt-3 ${inputClass}`}
              />
            )}
          </fieldset>
          <fieldset>
            <legend className={labelClass}>{t('insured')}</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              <Chip selected={insured === 'yes'} onSelect={() => setInsured('yes')}>
                {t('yes')}
              </Chip>
              <Chip selected={insured === 'no'} onSelect={() => setInsured('no')}>
                {t('no')}
              </Chip>
            </div>
          </fieldset>
          <fieldset>
            <legend className={labelClass}>{t('wsib')}</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              <Chip selected={wsib === 'yes'} onSelect={() => setWsib('yes')}>
                {t('yes')}
              </Chip>
              <Chip selected={wsib === 'no'} onSelect={() => setWsib('no')}>
                {t('no')}
              </Chip>
            </div>
            {wsib === 'yes' && (
              <input
                type="text"
                placeholder={t('wsibNumber')}
                value={wsibNumber}
                onChange={(e) => setWsibNumber(e.target.value)}
                className={`mt-3 ${inputClass}`}
              />
            )}
          </fieldset>
          <div>
            <label htmlFor="full_name" className={labelClass}>
              {t('fullName')}
            </label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              required
              autoComplete="name"
              className={`mt-1.5 ${inputClass}`}
            />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="phone" className={labelClass}>
                {t('phone')}
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                autoComplete="tel"
                placeholder="(647) 555-0199"
                className={`mt-1.5 ${inputClass}`}
              />
            </div>
            <div>
              <label htmlFor="email" className={labelClass}>
                {t('email')}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                className={`mt-1.5 ${inputClass}`}
              />
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {step > 1 && (
          <button
            type="button"
            onClick={() => {
              setStepError(null);
              setStep(1);
            }}
            className="rounded-full border border-border px-6 py-3 text-sm font-semibold text-foreground transition hover:border-brand hover:text-brand"
          >
            {t('back')}
          </button>
        )}
        {step < 2 ? (
          <button
            type="button"
            onClick={goNext}
            className={`w-full sm:w-auto ${MARKETING_CTA}`}
          >
            {t('continue')}
          </button>
        ) : (
          <SubmitButton>{t('submit')}</SubmitButton>
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
