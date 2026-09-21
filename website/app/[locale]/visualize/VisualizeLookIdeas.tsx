'use client';

import { useLocale, useTranslations } from 'next-intl';
import { formatCad } from '@/lib/format-cad';
import { curatedLooks } from '@/lib/visualize-showcase';
import type { VisualizeSession } from './actions';

export function VisualizeLookIdeas({
  session,
  busy,
  onPreset,
}: {
  session: VisualizeSession;
  busy: boolean;
  onPreset: (packageId: string) => void;
}) {
  const t = useTranslations('Visualize');
  const locale = useLocale();
  const looks = curatedLooks
    .map((look) => {
      const pkg = (session.packages ?? []).find((row) => row.slug === look.slug);
      if (!pkg) return null;
      return { ...look, pkg };
    })
    .filter((row): row is NonNullable<typeof row> => Boolean(row));

  if (looks.length === 0) return null;

  return (
    <section className="rounded-2xl border border-border bg-surface px-4 py-3">
      <p className="text-sm font-medium text-foreground">{t('wizard.ideasTitle')}</p>
      <p className="mt-1 text-xs text-foreground/60">
        {t('wizard.ideasHint', { price: formatCad(session.price_cad, locale) })}
      </p>
      <div className="mt-3 grid max-w-xs gap-3">
        {looks.map((look) => {
          const selected = session.package_slug === look.slug;
          return (
            <button
              key={look.slug}
              type="button"
              disabled={busy}
              aria-pressed={selected}
              onClick={() => onPreset(look.pkg.id)}
              className={`overflow-hidden rounded-xl border text-left transition disabled:opacity-50 ${
                selected ? 'border-brand ring-1 ring-brand' : 'border-border hover:border-brand/60'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={look.image}
                alt={t(`packages.${look.slug}.name`)}
                className="aspect-[4/3] w-full object-cover"
              />
              <span className="block px-3 py-2">
                <span className="block text-sm font-semibold text-foreground">
                  {t(`packages.${look.slug}.name`)}
                </span>
                <span className="mt-0.5 block text-xs leading-relaxed text-foreground/65">
                  {t(`packages.${look.slug}.blurb`)}
                </span>
                <span className="mt-1 block text-xs font-medium tabular-nums text-foreground/80">
                  {formatCad(look.pkg.estimate_low, locale)} – {formatCad(look.pkg.estimate_high, locale)}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
