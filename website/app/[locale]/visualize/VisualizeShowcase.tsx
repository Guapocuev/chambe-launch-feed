'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { BeforeAfterSlider } from '@/components/BeforeAfterSlider';
import { formatCad } from '@/lib/format-cad';
import { visualizeShowcaseExamples, type VisualizeShowcaseExampleId } from '@/lib/visualize-showcase';

export function VisualizeShowcase() {
  const locale = useLocale();
  const t = useTranslations('Visualize');
  const [activeId, setActiveId] = useState<VisualizeShowcaseExampleId>(visualizeShowcaseExamples[0].id);
  const example = visualizeShowcaseExamples.find((item) => item.id === activeId) ?? visualizeShowcaseExamples[0];

  return (
    <section className="rounded-2xl border border-border bg-surface px-4 py-5 sm:px-5 sm:py-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-accent">{t('showcaseKicker')}</p>
      <h2 className="mt-1 text-xl font-bold tracking-tight text-foreground sm:text-2xl">{t('showcaseTitle')}</h2>
      <p className="mt-2 text-sm leading-relaxed text-foreground/70">
        {t('showcaseBody', { price: formatCad(19, locale) })}
      </p>

      <div className="mt-4">
        <BeforeAfterSlider
          key={example.id}
          beforeSrc={example.before}
          afterSrc={example.after}
          beforeAlt={t(`examples.${example.id}.beforeAlt`)}
          afterAlt={t(`examples.${example.id}.afterAlt`)}
          beforeLabel={t('showcaseBefore')}
          afterLabel={t('showcaseAfter')}
          priority
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {visualizeShowcaseExamples.map((item) => {
          const selected = item.id === activeId;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveId(item.id)}
              aria-pressed={selected}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                selected
                  ? 'bg-inverse text-inverse-foreground'
                  : 'border border-border bg-background text-foreground/80 hover:border-brand hover:text-brand'
              }`}
            >
              {t(`examples.${item.id}.label`)}
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-foreground/55">{t(`examples.${example.id}.note`)}</p>
    </section>
  );
}
