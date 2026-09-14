'use client';

import { useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname } from '@/i18n/navigation';
import { withLocalePrefix } from '@/i18n/pathname';
import { routing, type AppLocale } from '@/i18n/routing';

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
const SWITCH_ATTR = 'data-locale-switch';

function persistLocale(code: AppLocale) {
  document.cookie = `NEXT_LOCALE=${code};path=/;max-age=${COOKIE_MAX_AGE};SameSite=Lax`;
}

function localeFromAnchor(node: EventTarget | null): { code: AppLocale; href: string } | null {
  if (!(node instanceof Element)) return null;
  const anchor = node.closest(`a[${SWITCH_ATTR}]`);
  if (!(anchor instanceof HTMLAnchorElement)) return null;
  const code = anchor.getAttribute(SWITCH_ATTR);
  if (code !== 'en' && code !== 'es') return null;
  return { code, href: anchor.getAttribute('href') || anchor.href };
}

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const t = useTranslations('LocaleSwitcher');
  const locale = useLocale();
  const pathname = usePathname();

  useEffect(() => {
    function onPointerDown(event: Event) {
      const target = localeFromAnchor(event.target);
      if (target) persistLocale(target.code);
    }
    function onClick(event: Event) {
      const target = localeFromAnchor(event.target);
      if (!target) return;
      persistLocale(target.code);
      if (target.code === locale) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      if ('stopImmediatePropagation' in event) event.stopImmediatePropagation();
      window.location.assign(target.href);
    }
    // Window capture runs before Next.js document-level client routing.
    window.addEventListener('pointerdown', onPointerDown, true);
    window.addEventListener('click', onClick, true);
    return () => {
      window.removeEventListener('pointerdown', onPointerDown, true);
      window.removeEventListener('click', onClick, true);
    };
  }, [locale]);

  return (
    <nav
      className={compact ? 'flex items-center gap-1' : 'flex items-center gap-1 sm:gap-2'}
      aria-label={t('label')}
    >
      {routing.locales.map((code) => {
        const active = code === locale;
        const href = withLocalePrefix(pathname, code);
        return (
          <a
            key={code}
            href={href}
            hrefLang={code}
            aria-current={active ? 'true' : undefined}
            aria-label={t(code)}
            data-locale-switch={code}
            className={
              active
                ? 'rounded-full bg-foreground px-2.5 py-1 text-xs font-semibold text-background'
                : 'rounded-full px-2.5 py-1 text-xs font-semibold text-foreground/70 transition hover:bg-surface hover:text-foreground'
            }
          >
            {code === 'en' ? 'EN' : 'ES'}
          </a>
        );
      })}
    </nav>
  );
}
