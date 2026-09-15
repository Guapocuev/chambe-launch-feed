'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from '@/i18n/navigation';
import { formatCad } from '@/lib/format-cad';
import {
  attachVisualizePhoto,
  confirmVisualizeCheckout,
  generateVisualizePreview,
  resolveVisualizeSession,
  selectVisualizePackage,
  startVisualizeCheckout,
  type VisualizeSession,
} from './actions';
import { HeroPhotoUpload } from './HeroPhotoUpload';

const PACKAGE_SLUGS = ['refresh', 'modern_light', 'warm_heritage', 'signature'] as const;

function isPackageSlug(value: string | null | undefined): value is (typeof PACKAGE_SLUGS)[number] {
  return Boolean(value && (PACKAGE_SLUGS as readonly string[]).includes(value));
}

export function VisualizeApp() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('Visualize');
  const search = useSearchParams();
  const [session, setSession] = useState<VisualizeSession | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const resolved = await resolveVisualizeSession();
      if (!resolved.ok) {
        setError(resolved.error);
        return;
      }
      let current = resolved.data.session;
      const checkoutId = search.get('checkout');
      if (search.get('paid') === '1' && checkoutId) {
        const confirmed = await confirmVisualizeCheckout(current.id, checkoutId);
        if (confirmed.ok) current = confirmed.data;
      }
      setSession(current);
    })();
  }, [search]);

  async function onPhoto(path: string) {
    if (!session) return;
    setBusy(true);
    setError(null);
    const next = await attachVisualizePhoto(session.id, path);
    setBusy(false);
    if (!next.ok) {
      setError(next.error);
      return;
    }
    setSession(next.data);
  }

  async function onPickPackage(packageId: string) {
    if (!session || busy) return;
    setBusy(true);
    setError(null);
    const next = await selectVisualizePackage(session.id, packageId);
    setBusy(false);
    if (!next.ok) {
      setError(next.error);
      return;
    }
    setSession(next.data);
  }

  async function onPay() {
    if (!session) return;
    setBusy(true);
    setError(null);
    const started = await startVisualizeCheckout(session.id);
    setBusy(false);
    if (!started.ok) {
      setError(started.error);
      return;
    }
    window.location.href = started.data.checkout_url;
  }

  async function onGenerate() {
    if (!session) return;
    setBusy(true);
    setError(null);
    const next = await generateVisualizePreview(session.id);
    setBusy(false);
    if (!next.ok) {
      setError(next.error);
      return;
    }
    setSession(next.data);
    router.replace('/visualize');
  }

  if (!session && !error) {
    return <p className="text-sm text-foreground/70">{t('opening')}</p>;
  }

  if (!session) {
    return <p className="text-sm text-red-700 dark:text-red-300">{error}</p>;
  }

  const failed = session.status === 'failed';
  const selectedSlug = isPackageSlug(session.package_slug) ? session.package_slug : 'modern_light';
  const ready = session.status === 'ready' && Boolean(session.generated_photo_url);
  const canPay = Boolean(session.hero_photo_url || session.status === 'photo_ready') && !session.paid;
  const canGenerate = session.paid && session.status !== 'generating' && !ready;

  return (
    <div className="space-y-6">
      {error && (
        <p className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      <div>
        <p className="text-sm font-medium text-foreground">{t('packages.choose')}</p>
        <p className="mt-1 text-xs text-foreground/60">
          {t('packages.hint', { price: formatCad(session.price_cad, locale) })}
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {(session.packages ?? []).map((pkg) => {
            const slug = isPackageSlug(pkg.slug) ? pkg.slug : 'modern_light';
            const selected = pkg.id === session.package_id || pkg.slug === session.package_slug;
            return (
              <button
                key={pkg.id}
                type="button"
                disabled={busy || session.status === 'generating'}
                onClick={() => void onPickPackage(pkg.id)}
                aria-pressed={selected}
                className={`rounded-2xl border px-4 py-3 text-left transition ${
                  selected
                    ? 'border-brand bg-brand/5 ring-1 ring-brand'
                    : 'border-border bg-surface hover:border-brand/60'
                } disabled:opacity-50`}
              >
                <p className="text-sm font-semibold text-foreground">{t(`packages.${slug}.name`)}</p>
                <p className="mt-1 text-xs leading-relaxed text-foreground/65">{t(`packages.${slug}.blurb`)}</p>
                <p className="mt-2 text-sm font-semibold tabular-nums text-foreground">
                  {`${formatCad(pkg.estimate_low, locale)} – ${formatCad(pkg.estimate_high, locale)}`}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-surface px-4 py-4 text-sm text-foreground/80">
        <p>{t('style', { style: t(`packages.${selectedSlug}.name`) })}</p>
        <p className="mt-2">
          {session.area_sqft_source === 'job_features'
            ? t('usesSqft', { sqft: session.area_sqft ?? 0 })
            : t('typicalKitchen')}
        </p>
        {session.estimate_low != null && session.estimate_high != null && (
          <p className="mt-2 text-lg font-semibold text-foreground">
            {`${formatCad(session.estimate_low, locale)} – ${formatCad(session.estimate_high, locale)}`}
          </p>
        )}
      </div>

      {!session.hero_photo_url && session.status !== 'ready' && (
        <HeroPhotoUpload onPath={(path) => void onPhoto(path)} disabled={busy} />
      )}

      {(session.hero_photo_url || session.generated_photo_url) && (
        <div className="grid gap-4 md:grid-cols-2">
          <figure>
            {session.hero_photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={session.hero_photo_url} alt={t('altToday')} className="w-full rounded-xl border border-border object-cover" />
            ) : (
              <div className="rounded-xl border border-border px-4 py-16 text-center text-sm text-foreground/55">
                {t('originalPhoto')}
              </div>
            )}
            <figcaption className="mt-2 text-xs font-medium text-foreground/70">{t('beforeCaption')}</figcaption>
          </figure>
          <figure>
            {ready && session.generated_photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={session.generated_photo_url}
                alt={t('altPreview', { style: t(`packages.${selectedSlug}.name`) })}
                className="w-full rounded-xl border border-border object-cover"
              />
            ) : (
              <div className="flex min-h-48 items-center justify-center rounded-xl border border-dashed border-border px-4 text-center text-sm text-foreground/55">
                {failed
                  ? t('previewFailed')
                  : session.status === 'generating'
                    ? t('generating')
                    : t('afterPlaceholder')}
              </div>
            )}
            <figcaption className="mt-2 text-xs font-medium text-foreground/70">
              {t('afterCaption')}
            </figcaption>
          </figure>
        </div>
      )}

      {failed && session.error_message && (
        <p className="text-sm text-foreground/70">{session.error_message}</p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        {canPay && (
          <button
            type="button"
            disabled={busy}
            onClick={() => void onPay()}
            className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-inverse disabled:opacity-50"
          >
            {t('pay', { price: formatCad(session.price_cad, locale) })}
          </button>
        )}
        {canGenerate && (
          <button
            type="button"
            disabled={busy}
            onClick={() => void onGenerate()}
            className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-inverse disabled:opacity-50"
          >
            {failed ? t('retry') : busy ? t('generating') : t('generate')}
          </button>
        )}
      </div>
    </div>
  );
}
