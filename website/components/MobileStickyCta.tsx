'use client';

import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { trackEvent } from '@/lib/analytics';
import { CONTACT_PHONE, CONTACT_PHONE_TEL } from '@/lib/site';
import { isAppArea } from '@/lib/contractor-area';

const HIDDEN_ON = new Set(['/get-a-quote', '/apply', '/apprentices']);

export function MobileStickyCta() {
  const t = useTranslations('Cta');
  const pathname = usePathname();

  if (HIDDEN_ON.has(pathname) || isAppArea(pathname)) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-4 py-3 backdrop-blur md:hidden"
      role="region"
      aria-label={t('quickActions')}
    >
      <div className="mx-auto flex max-w-lg items-center gap-2">
        {CONTACT_PHONE && (
          <a
            href={CONTACT_PHONE_TEL}
            onClick={() => trackEvent({ name: 'phone_click', params: { location: 'mobile_sticky' } })}
            className="shrink-0 rounded-full border border-border px-4 py-3 text-sm font-semibold text-foreground transition hover:border-brand"
          >
            {t('call')}
          </a>
        )}
        <Link
          href="/get-a-quote"
          onClick={() =>
            trackEvent({
              name: 'cta_click',
              params: { location: 'mobile_sticky', label: t('getEstimate'), href: '/get-a-quote' },
            })
          }
          className="flex-1 rounded-full bg-accent py-3 text-center text-sm font-semibold text-inverse transition hover:bg-accent-dark"
        >
          {t('getEstimate')}
        </Link>
      </div>
    </div>
  );
}
