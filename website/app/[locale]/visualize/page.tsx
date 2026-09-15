import { getLocale, getTranslations } from 'next-intl/server';
import { Suspense } from 'react';
import { pageMetadata } from '@/lib/metadata';
import { formatCad } from '@/lib/format-cad';
import { VisualizeApp } from './VisualizeApp';
import { VisualizeShowcase } from './VisualizeShowcase';

export async function generateMetadata() {
  const t = await getTranslations('Visualize');
  return pageMetadata(t('title'), t('body', { price: formatCad(19, 'en') }), '/visualize');
}

export const dynamic = 'force-dynamic';
export const maxDuration = 80;

export default async function VisualizePage() {
  const t = await getTranslations('Visualize');
  const locale = await getLocale();
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-sm font-semibold uppercase tracking-wide text-foreground/50">{t('kicker')}</p>
      <h1 className="mt-2 text-4xl font-bold tracking-tight text-foreground">{t('title')}</h1>
      <p className="mt-4 text-lg text-foreground/70">{t('body', { price: formatCad(19, locale) })}</p>
      <div className="mt-10">
        <VisualizeShowcase />
      </div>
      <div className="mt-10">
        <Suspense fallback={<p className="text-sm text-foreground/70">{t('opening')}</p>}>
          <VisualizeApp />
        </Suspense>
      </div>
    </div>
  );
}
