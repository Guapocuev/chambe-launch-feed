'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Logo } from '@/components/Logo';
import { Link, usePathname } from '@/i18n/navigation';
import { isApprenticeArea, isContractorArea, isVisualizeArea } from '@/lib/contractor-area';

const estimateClass =
  'rounded-full bg-accent px-3 py-2 text-center text-xs font-semibold text-inverse transition hover:bg-accent-dark sm:px-5 sm:py-2.5 sm:text-sm';

export function Nav() {
  const t = useTranslations('Nav');
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const links = [
    { href: '/how-it-works', label: t('howItWorks') },
    { href: '/about', label: t('about') },
    { href: '/gallery', label: t('gallery') },
    { href: '/contact', label: t('contact') },
  ] as const;

  if (isVisualizeArea(pathname)) {
    return (
      <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between gap-3 px-6">
          <Logo size="md" />
          <LanguageSwitcher compact />
        </div>
      </header>
    );
  }

  if (isApprenticeArea(pathname) || isContractorArea(pathname)) {
    return (
      <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-md items-center justify-between gap-3 px-5">
          <Logo size="md" />
          <LanguageSwitcher compact />
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
        <Logo size="lg" />

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition hover:text-brand ${
                pathname === link.href ? 'text-brand' : 'text-foreground/80'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageSwitcher />
          <Link
            href="/apprentices"
            className="hidden text-sm font-medium text-foreground/80 transition hover:text-brand md:inline"
          >
            {t('apprentices')}
          </Link>
          <Link
            href="/apply"
            className="hidden text-sm font-medium text-foreground/80 transition hover:text-brand md:inline"
          >
            {t('becomeContractor')}
          </Link>
          <Link href="/get-a-quote" className={`${estimateClass} whitespace-nowrap`}>
            {t('getEstimate')}
          </Link>
          <button
            type="button"
            className="flex items-center justify-center rounded-md p-2 md:hidden"
            aria-label={open ? t('closeMenu') : t('openMenu')}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <span className="sr-only">{t('toggleMenu')}</span>
            <div className="flex h-5 w-6 flex-col justify-between">
              <span className={`h-0.5 w-full bg-foreground transition ${open ? 'translate-y-2.5 rotate-45' : ''}`} />
              <span className={`h-0.5 w-full bg-foreground transition ${open ? 'opacity-0' : ''}`} />
              <span className={`h-0.5 w-full bg-foreground transition ${open ? '-translate-y-2 -rotate-45' : ''}`} />
            </div>
          </button>
        </div>
      </div>

      {open && (
        <nav className="flex flex-col gap-1 border-t border-border px-6 py-4 md:hidden">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-md px-2 py-2 text-sm font-medium text-foreground/80 hover:bg-surface"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/apprentices"
            onClick={() => setOpen(false)}
            className="rounded-md px-2 py-2 text-sm font-medium text-foreground/80 hover:bg-surface"
          >
            {t('apprentices')}
          </Link>
          <Link
            href="/apply"
            onClick={() => setOpen(false)}
            className="rounded-md px-2 py-2 text-sm font-medium text-foreground/80 hover:bg-surface"
          >
            {t('becomeContractor')}
          </Link>
        </nav>
      )}
    </header>
  );
}
