'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { formatCad } from '@/lib/format-cad';
import { HeroPhotoUpload } from './HeroPhotoUpload';
import type { FinishOption, VisualizeSession } from './actions';

const WIZARD_CATEGORIES = [
  'cabinet_scope',
  'cabinet_finish',
  'countertop',
  'flooring',
  'lighting',
] as const;

type WizardCategory = (typeof WIZARD_CATEGORIES)[number];
type Step = 'photo' | 'size' | WizardCategory | 'must_haves' | 'review';

const STEPS: Step[] = ['photo', 'size', ...WIZARD_CATEGORIES, 'must_haves', 'review'];

function optionLabel(t: ReturnType<typeof useTranslations<'Visualize'>>, option: FinishOption): string {
  return t(`catalog.${option.category}.${option.slug}.label`);
}

function optionBlurb(t: ReturnType<typeof useTranslations<'Visualize'>>, option: FinishOption): string {
  return t(`catalog.${option.category}.${option.slug}.blurb`);
}

function compatibleOptions(session: VisualizeSession, category: WizardCategory): FinishOption[] {
  const scope = session.selections.cabinet_scope;
  return session.options
    .filter((option) => option.category === category)
    .filter((option) => {
      if (category !== 'cabinet_finish' || !option.compatible_with?.length) return true;
      if (!scope) return true;
      return option.compatible_with.includes(scope);
    });
}

function firstIncomplete(session: VisualizeSession): Step {
  if (!session.hero_photo_url && session.status !== 'ready') return 'photo';
  if (session.area_sqft_source === 'package_default') return 'size';
  for (const category of WIZARD_CATEGORIES) {
    if (!session.selections[category]) return category;
  }
  return 'review';
}

export function VisualizeIntake({
  session,
  busy,
  onPhoto,
  onPreset,
  onSave,
}: {
  session: VisualizeSession;
  busy: boolean;
  onPhoto: (path: string) => void;
  onPreset: (packageId: string) => void;
  onSave: (input: {
    selections?: VisualizeSession['selections'];
    must_haves?: string;
    area_sqft?: number;
  }) => Promise<void>;
}) {
  const t = useTranslations('Visualize');
  const locale = useLocale();
  const [step, setStep] = useState<Step>(() => firstIncomplete(session));
  const [sqft, setSqft] = useState(String(session.area_sqft ?? 150));
  const [mustHaves, setMustHaves] = useState(session.must_haves ?? '');

  const stepIndex = STEPS.indexOf(step);
  const range =
    session.estimate_low != null && session.estimate_high != null
      ? `${formatCad(session.estimate_low, locale)} – ${formatCad(session.estimate_high, locale)}`
      : null;

  const sizeKnown = session.area_sqft_source !== 'package_default';

  async function goNext() {
    const next = STEPS[stepIndex + 1];
    if (next) setStep(next);
  }

  async function confirmSize() {
    const parsed = Number.parseInt(sqft, 10);
    if (!Number.isFinite(parsed) || parsed < 20 || parsed > 100_000) return;
    await onSave({ area_sqft: parsed });
    await goNext();
  }

  async function pickOption(category: WizardCategory, slug: string) {
    await onSave({ selections: { [category]: slug } });
    const next = STEPS[stepIndex + 1];
    if (next) setStep(next);
  }

  async function saveMustHaves() {
    await onSave({ must_haves: mustHaves });
    setStep('review');
  }

  useEffect(() => {
    if (step !== 'photo' || !session.hero_photo_url) return;
    setStep(session.area_sqft_source === 'package_default' ? 'size' : 'cabinet_scope');
  }, [session.area_sqft_source, session.hero_photo_url, step]);

  const remaining = 200 - mustHaves.length;

  const breakdown = session.estimate_breakdown;
  const reviewLines = useMemo(() => {
    if (!breakdown) return [];
    return [
      { key: 'labor' as const, line: breakdown.labor },
      { key: 'cabinets' as const, line: breakdown.cabinets },
      { key: 'counters' as const, line: breakdown.counters },
      { key: 'flooring' as const, line: breakdown.flooring },
      { key: 'lighting' as const, line: breakdown.lighting },
      { key: 'backsplash' as const, line: breakdown.backsplash },
      { key: 'dispatch' as const, line: breakdown.dispatch },
    ];
  }, [breakdown]);

  return (
    <div className="space-y-5">
      {step !== 'photo' && step !== 'review' && (
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            className="text-sm text-foreground/60 hover:text-foreground"
            disabled={busy || stepIndex <= 0}
            onClick={() => setStep(STEPS[Math.max(0, stepIndex - 1)]!)}
          >
            {t('wizard.back')}
          </button>
          {range && (
            <p className="text-sm font-semibold tabular-nums text-foreground">{range}</p>
          )}
        </div>
      )}

      {step === 'photo' && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">{t('wizard.photoTitle')}</h2>
          <HeroPhotoUpload onPath={onPhoto} disabled={busy} />
        </section>
      )}

      {step === 'size' && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">{t('wizard.sizeTitle')}</h2>
          <p className="text-sm text-foreground/70">
            {sizeKnown ? t('wizard.sizeKnown', { sqft: session.area_sqft ?? 150 }) : t('wizard.sizeGuess')}
          </p>
          <label className="block text-sm font-medium text-foreground" htmlFor="kitchen-sqft">
            {t('wizard.sizeLabel')}
          </label>
          <input
            id="kitchen-sqft"
            type="number"
            min={20}
            max={100000}
            value={sqft}
            disabled={busy}
            onChange={(event) => setSqft(event.target.value)}
            className="w-32 rounded-lg border border-border bg-surface px-3 py-2 text-sm tabular-nums"
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => void confirmSize()}
            className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-inverse disabled:opacity-50"
          >
            {t('wizard.sizeContinue')}
          </button>
        </section>
      )}

      {WIZARD_CATEGORIES.includes(step as WizardCategory) && (
        <section className="space-y-3">
          {step === 'cabinet_scope' && (
            <div className="rounded-2xl border border-border bg-surface px-4 py-3">
              <p className="text-sm font-medium text-foreground">{t('wizard.presetsTitle')}</p>
              <p className="mt-1 text-xs text-foreground/60">{t('wizard.presetsHint')}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {(session.packages ?? []).map((pkg) => (
                  <button
                    key={pkg.id}
                    type="button"
                    disabled={busy}
                    onClick={() => void onPreset(pkg.id)}
                    className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:border-brand disabled:opacity-50"
                  >
                    {t(`packages.${pkg.slug}.name`)}
                  </button>
                ))}
              </div>
              {session.selections_complete && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setStep('review')}
                  className="mt-3 text-sm font-medium text-brand"
                >
                  {t('wizard.skipToQuote')}
                </button>
              )}
            </div>
          )}
          <h2 className="text-lg font-semibold text-foreground">{t(`wizard.questions.${step}`)}</h2>
          <p className="text-sm text-foreground/70">{t(`wizard.helps.${step}`)}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {compatibleOptions(session, step as WizardCategory).map((option) => {
              const selected = session.selections[option.category] === option.slug;
              return (
                <button
                  key={option.slug}
                  type="button"
                  disabled={busy}
                  aria-pressed={selected}
                  onClick={() => void pickOption(option.category as WizardCategory, option.slug)}
                  className={`rounded-2xl border px-4 py-3 text-left transition ${
                    selected
                      ? 'border-brand bg-brand/5 ring-1 ring-brand'
                      : 'border-border bg-surface hover:border-brand/60'
                  } disabled:opacity-50`}
                >
                  <span className="flex items-center gap-3">
                    {option.swatch_hex && (
                      <span
                        className="h-8 w-8 shrink-0 rounded-full border border-border"
                        style={{ backgroundColor: option.swatch_hex }}
                        aria-hidden
                      />
                    )}
                    <span>
                      <span className="block text-sm font-semibold text-foreground">{optionLabel(t, option)}</span>
                      <span className="mt-1 block text-xs leading-relaxed text-foreground/65">
                        {optionBlurb(t, option)}
                      </span>
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {step === 'must_haves' && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">{t('wizard.mustHavesTitle')}</h2>
          <p className="text-sm text-foreground/70">{t('wizard.mustHavesHelp')}</p>
          <textarea
            value={mustHaves}
            maxLength={200}
            disabled={busy}
            onChange={(event) => setMustHaves(event.target.value.slice(0, 200))}
            placeholder={t('wizard.mustHavesPlaceholder')}
            className="min-h-28 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm"
          />
          <p className="text-xs text-foreground/55">{t('wizard.remaining', { count: remaining })}</p>
          <button
            type="button"
            disabled={busy}
            onClick={() => void saveMustHaves()}
            className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-inverse disabled:opacity-50"
          >
            {t('wizard.next')}
          </button>
        </section>
      )}

      {step === 'review' && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">{t('wizard.reviewTitle')}</h2>
            <button
              type="button"
              className="text-sm text-foreground/60 hover:text-foreground"
              onClick={() => setStep('cabinet_scope')}
            >
              {t('wizard.back')}
            </button>
          </div>
          {session.area_sqft_source === 'package_default' ? (
            <p className="text-sm text-foreground/70">{t('typicalKitchen')}</p>
          ) : (
            <p className="text-sm text-foreground/70">{t('usesSqft', { sqft: session.area_sqft ?? 0 })}</p>
          )}
          {breakdown && (
            <div className="rounded-2xl border border-border bg-surface px-4 py-4 text-sm">
              <p className="font-medium text-foreground">{t('wizard.breakdownTitle')}</p>
              <dl className="mt-3 space-y-2">
                {reviewLines.map(({ key, line }) => (
                  <div key={key} className="flex items-start justify-between gap-3">
                    <dt className="text-foreground/70">
                      {t(`wizard.lines.${key}`)}
                      {key === 'labor' && line.hours != null
                        ? ` · ${t('wizard.hours', { hours: line.hours })}`
                        : line.label && key !== 'labor' && key !== 'dispatch'
                          ? ` · ${line.label}`
                          : ''}
                    </dt>
                    <dd className="font-medium tabular-nums text-foreground">{formatCad(line.subtotal, locale)}</dd>
                  </div>
                ))}
              </dl>
              {range && (
                <p className="mt-4 text-lg font-semibold tabular-nums text-foreground">{range}</p>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
