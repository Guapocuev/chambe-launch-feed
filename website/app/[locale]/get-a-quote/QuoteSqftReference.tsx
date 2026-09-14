'use client';

import { useTranslations } from 'next-intl';

/** Lightweight size reference — not a measuring tool. */
export function QuoteSqftReference() {
  const t = useTranslations('Quote');
  return (
    <div className="mt-3 rounded-lg border border-border bg-background px-3 py-3">
      <div className="flex items-start gap-3">
        <RoomOutline />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-foreground">{t('sqftRefTitle')}</p>
          <ul className="mt-1.5 space-y-1 text-xs text-foreground/70">
            <li>{t('sqftKitchen')}</li>
            <li>{t('sqftBedroom')}</li>
            <li>{t('sqftLiving')}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function RoomOutline() {
  const t = useTranslations('Quote');
  return (
    <svg
      viewBox="0 0 88 72"
      className="mt-0.5 h-16 w-20 shrink-0 text-foreground/55"
      role="img"
      aria-label={t('sqftAria')}
    >
      <rect
        x="10"
        y="8"
        width="56"
        height="44"
        rx="3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <path d="M28 52v6M48 52v6M66 22h6M66 38h6" stroke="currentColor" strokeWidth="1.5" />
      <text x="38" y="68" textAnchor="middle" fontSize="8" fill="currentColor">
        {t('length')}
      </text>
      <text x="82" y="34" textAnchor="middle" fontSize="8" fill="currentColor">
        {t('width')}
      </text>
      <text x="38" y="34" textAnchor="middle" fontSize="8" fill="currentColor">
        {t('area')}
      </text>
    </svg>
  );
}
