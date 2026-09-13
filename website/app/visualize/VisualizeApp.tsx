'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  attachVisualizePhoto,
  confirmVisualizeCheckout,
  generateVisualizePreview,
  resolveVisualizeSession,
  startVisualizeCheckout,
  type VisualizeSession,
} from './actions';
import { HeroPhotoUpload } from './HeroPhotoUpload';

export function VisualizeApp() {
  const router = useRouter();
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
    return <p className="text-sm text-foreground/70">Opening your preview…</p>;
  }

  if (!session) {
    return <p className="text-sm text-red-700 dark:text-red-300">{error}</p>;
  }

  const failed = session.status === 'failed';
  const ready = session.status === 'ready' && session.generated_photo_url;
  const canPay = Boolean(session.hero_photo_url || session.status === 'photo_ready') && !session.paid;
  const canGenerate = session.paid && !ready && session.status !== 'generating';

  return (
    <div className="space-y-6">
      {error && (
        <p className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      <div className="rounded-2xl border border-border bg-surface px-4 py-4 text-sm text-foreground/80">
        <p>
          Style for this phase: <span className="font-semibold text-foreground">modern light renovation</span>.
          Camera, windows, and room volume stay put.
        </p>
        <p className="mt-2">
          {session.area_sqft_source === 'job_features'
            ? `Estimate uses the ${session.area_sqft} sqft you already gave us on a quote.`
            : 'Estimated for a typical kitchen (150 sqft) — final quote may vary.'}
        </p>
        {session.estimate_low != null && session.estimate_high != null && (
          <p className="mt-2 text-lg font-semibold text-foreground">
            ${session.estimate_low.toLocaleString('en-CA')} – ${session.estimate_high.toLocaleString('en-CA')}{' '}
            <span className="text-sm font-normal text-foreground/60">CAD</span>
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
              <img src={session.hero_photo_url} alt="Your kitchen today" className="w-full rounded-xl border border-border object-cover" />
            ) : (
              <div className="rounded-xl border border-border px-4 py-16 text-center text-sm text-foreground/55">
                Original photo
              </div>
            )}
            <figcaption className="mt-2 text-xs font-medium text-foreground/70">Before — your photo</figcaption>
          </figure>
          <figure>
            {ready && session.generated_photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={session.generated_photo_url}
                alt="Illustrative modern light kitchen preview"
                className="w-full rounded-xl border border-border object-cover"
              />
            ) : (
              <div className="flex min-h-48 items-center justify-center rounded-xl border border-dashed border-border px-4 text-center text-sm text-foreground/55">
                {failed
                  ? 'Preview failed. Your original photo is still on the left.'
                  : session.status === 'generating'
                    ? 'Generating the preview…'
                    : 'After — appears after payment and generation'}
              </div>
            )}
            <figcaption className="mt-2 text-xs font-medium text-foreground/70">
              After — illustrative AI preview, not a guarantee of the finished look
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
            Pay ${session.price_cad} to generate
          </button>
        )}
        {canGenerate && (
          <button
            type="button"
            disabled={busy}
            onClick={() => void onGenerate()}
            className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-inverse disabled:opacity-50"
          >
            {failed ? 'Retry preview' : busy ? 'Generating…' : 'Generate preview'}
          </button>
        )}
      </div>
    </div>
  );
}
