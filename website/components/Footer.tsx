'use client';

import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { Logo } from '@/components/Logo';
import { isAppArea } from '@/lib/contractor-area';

export function Footer() {
  const t = useTranslations('Footer');
  const pathname = usePathname();
  if (isAppArea(pathname)) return null;

  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <Logo size="md" />
            <p className="mt-2 text-sm text-foreground/70">{t('tagline')}</p>
          </div>

          <div>
            <div className="text-sm font-semibold text-foreground">{t('company')}</div>
            <ul className="mt-3 space-y-2 text-sm text-foreground/70">
              <li><Link href="/about" className="hover:text-brand">{t('about')}</Link></li>
              <li><Link href="/how-it-works" className="hover:text-brand">{t('howItWorks')}</Link></li>
              <li><Link href="/gallery" className="hover:text-brand">{t('pastWork')}</Link></li>
              <li><Link href="/contact" className="hover:text-brand">{t('contact')}</Link></li>
            </ul>
          </div>

          <div>
            <div className="text-sm font-semibold text-foreground">{t('getStarted')}</div>
            <ul className="mt-3 space-y-2 text-sm text-foreground/70">
              <li><Link href="/get-a-quote" className="hover:text-brand">{t('requestJob')}</Link></li>
              <li><Link href="/apply" className="hover:text-brand">{t('becomeContractor')}</Link></li>
              <li><Link href="/apprentices" className="hover:text-brand">{t('apprentices')}</Link></li>
            </ul>
          </div>

          <div>
            <div className="text-sm font-semibold text-foreground">{t('legal')}</div>
            <ul className="mt-3 space-y-2 text-sm text-foreground/70">
              <li><Link href="/privacy" className="hover:text-brand">{t('privacy')}</Link></li>
              <li><Link href="/terms" className="hover:text-brand">{t('terms')}</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-border pt-6 text-xs text-foreground/50">
          {t('copyright', { year: new Date().getFullYear() })}
        </div>
      </div>
    </footer>
  );
}
