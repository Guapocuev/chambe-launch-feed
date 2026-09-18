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
  saveVisualizeSelections,
  selectVisualizePackage,
  startVisualizeCheckout,
  type VisualizeSession,
} from './actions';
import { VisualizeIntake } from './VisualizeIntake';

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

  async function onPreset(packageId: string) {
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

  async function onSave(input: {
    selections?: VisualizeSession['selections'];
    must_haves?: string;
    area_sqft?: number;
  }) {
    if (!session) return;
    setBusy(true);
    setError(null);
    const next = await saveVisualizeSelections(session.id, input);
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
  const ready = session.status === 'ready' && Boolean(session.generated_photo_url) && !session.preview_stale;
  const sizeConfirmed = session.area_sqft_source !== 'package_default';
  const canPay =
    Boolean(session.hero_photo_url || session.status === 'photo_ready') &&
    session.selections_complete &&
    sizeConfirmed &&
    !session.paid;
  const canGenerate =
    session.paid &&
    session.status !== 'generating' &&
    session.selections_complete &&
    (!ready || session.preview_stale || failed);

  return (
    <div className="space-y-6">
      {error && (
        <p className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      <VisualizeIntake
        session={session}
        busy={busy}
        onPhoto={(path) => void onPhoto(path)}
        onPreset={(packageId) => void onPreset(packageId)}
        onSave={onSave}
      />

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
                alt={t('altPreview')}
                className="w-full rounded-xl border border-border object-cover"
              />
            ) : (
              <div className="flex min-h-48 items-center justify-center rounded-xl border border-dashed border-border px-4 text-center text-sm text-foreground/55">
                {failed
                  ? t('previewFailed')
                  : session.status === 'generating'
                    ? t('generating')
                    : session.preview_stale
                      ? t('wizard.stalePreview')
                      : t('afterPlaceholder')}
              </div>
            )}
            <figcaption className="mt-2 text-xs font-medium text-foreground/70">{t('afterCaption')}</figcaption>
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
            {failed
              ? t('retry')
              : busy
                ? t('generating')
                : session.preview_stale
                  ? t('wizard.generateUpdated')
                  : t('generate')}
          </button>
        )}
      </div>
    </div>
  );
}
