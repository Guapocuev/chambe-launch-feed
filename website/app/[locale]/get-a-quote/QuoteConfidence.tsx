'use client';

import { useTranslations } from 'next-intl';

const FOLLOW_UP_IDS = new Set([
  'area_sqft',
  'trade_picker',
  'elec_gfci',
  'elec_breaker',
  'elec_count',
  'plumb_source',
  'plumb_count',
  'plumb_pipe',
  'plumb_severity',
  'carp_where',
  'carp_failure',
  'carp_size',
]);

const EXPLANATION_IDS = new Set([
  'help_photos',
  'help_desc',
  'help_addr',
  'hurt_photos',
  'hurt_desc',
  'hurt_addr',
  'hurt_no_trade',
  'hurt_troubleshooting',
  'hurt_leak_source',
  'hurt_no_pricebook',
  'hurt_multi_trade',
  'hurt_condo_panel',
  'hurt_qty',
  'hurt_urgency',
  'hurt_size',
  'hurt_safety',
]);

export function QuoteConfidence({
  score,
  explanations,
  followUps,
}: {
  score: number;
  explanations: string[];
  followUps: string[];
}) {
  const t = useTranslations('Quote');
  const tFollow = useTranslations('FollowUps');
  const tExplain = useTranslations('Explanations');
  const shown = Math.min(99, Math.max(0, score));

  function copyFor(line: string): string {
    if (FOLLOW_UP_IDS.has(line)) return tFollow(line);
    if (EXPLANATION_IDS.has(line)) return tExplain(line);
    return line;
  }

  return (
    <div className="mt-4 rounded-xl border border-border bg-background px-4 py-4">
      <p className="text-sm font-medium text-foreground">
        {t('confidenceTitle')}{' '}
        <span className="tabular-nums">
          {shown}
          <span className="text-foreground/50">/100</span>
        </span>
      </p>
      {explanations.length > 0 && (
        <ul className="mt-2 space-y-1 text-sm text-foreground/70">
          {explanations.map((line) => (
            <li key={line}>{copyFor(line)}</li>
          ))}
        </ul>
      )}
      {shown < 70 && followUps.length > 0 && (
        <div className="mt-3">
          <p className="text-sm font-medium text-foreground">{t('tighterEstimate')}</p>
          <ul className="mt-1.5 list-disc space-y-1 pl-5 text-sm text-foreground/70">
            {followUps.map((prompt) => (
              <li key={prompt}>{copyFor(prompt)}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
