'use client';

import { useEffect, useId, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname } from '@/i18n/navigation';
import { withLocalePrefix } from '@/i18n/pathname';
import { routing, type AppLocale } from '@/i18n/routing';

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
const SWITCH_ATTR = 'data-locale-switch';
const TOAST_MS = 2800;

type LanguageOption = {
  id: string;
  name: string;
  lang: string;
  dir?: 'rtl';
  locale?: AppLocale;
};

const LANGUAGES: readonly LanguageOption[] = [
  { id: 'en', name: 'English', lang: 'en', locale: 'en' },
  { id: 'es', name: 'Español', lang: 'es', locale: 'es' },
  { id: 'pt', name: 'Português', lang: 'pt', locale: 'pt' },
  { id: 'it', name: 'Italiano', lang: 'it' },
  { id: 'zh', name: '中文', lang: 'zh' },
  { id: 'yue', name: '廣東話', lang: 'yue' },
  { id: 'pa', name: 'ਪੰਜਾਬੀ', lang: 'pa' },
  { id: 'ur', name: 'اردو', lang: 'ur', dir: 'rtl' },
  { id: 'tl', name: 'Tagalog', lang: 'tl' },
  { id: 'pl', name: 'Polski', lang: 'pl' },
];

function persistLocale(code: AppLocale) {
  document.cookie = `NEXT_LOCALE=${code};path=/;max-age=${COOKIE_MAX_AGE};SameSite=Lax`;
}

function localeFromAnchor(node: EventTarget | null): { code: AppLocale; href: string } | null {
  if (!(node instanceof Element)) return null;
  const anchor = node.closest(`a[${SWITCH_ATTR}]`);
  if (!(anchor instanceof HTMLAnchorElement)) return null;
  const code = anchor.getAttribute(SWITCH_ATTR);
  if (!code || !(routing.locales as readonly string[]).includes(code)) return null;
  return { code: code as AppLocale, href: anchor.getAttribute('href') || anchor.href };
}

function GlobeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const t = useTranslations('LocaleSwitcher');
  const locale = useLocale();
  const pathname = usePathname();
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const toastTimer = useRef<number | null>(null);
  const reactId = useId();
  const listId = `${reactId}-list`;
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(() =>
    Math.max(0, LANGUAGES.findIndex((item) => item.locale === locale)),
  );
  const [notice, setNotice] = useState<string | null>(null);

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

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      if (rootRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        setOpen(false);
        buttonRef.current?.focus();
      }
    }

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    return () => {
      if (toastTimer.current != null) window.clearTimeout(toastTimer.current);
    };
  }, []);

  function showUnavailableNotice() {
    const currentName = t(locale);
    const message = t('notAvailableYet', { language: currentName });
    setNotice(message);
    if (toastTimer.current != null) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setNotice(null), TOAST_MS);
  }

  function openMenu() {
    setHighlighted(Math.max(0, LANGUAGES.findIndex((item) => item.locale === locale)));
    setOpen(true);
  }

  function switchTo(code: AppLocale) {
    if (code === locale) {
      setOpen(false);
      return;
    }
    persistLocale(code);
    window.location.assign(withLocalePrefix(pathname, code));
  }

  function activate(index: number) {
    const option = LANGUAGES[index];
    if (!option) return;
    if (option.locale) {
      switchTo(option.locale);
      return;
    }
    showUnavailableNotice();
  }

  function onButtonKeyDown(event: ReactKeyboardEvent<HTMLButtonElement>) {
    if (!open) {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        openMenu();
      }
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlighted((index) => (index + 1) % LANGUAGES.length);
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlighted((index) => (index - 1 + LANGUAGES.length) % LANGUAGES.length);
      return;
    }
    if (event.key === 'Home') {
      event.preventDefault();
      setHighlighted(0);
      return;
    }
    if (event.key === 'End') {
      event.preventDefault();
      setHighlighted(LANGUAGES.length - 1);
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      activate(highlighted);
      return;
    }
    if (event.key === 'Tab') {
      setOpen(false);
    }
  }

  const activeId = `${reactId}-${LANGUAGES[highlighted]?.id ?? 'en'}`;
  const buttonClass = compact
    ? 'inline-flex items-center gap-1 rounded-full border border-border px-2 py-1 text-[11px] font-semibold text-foreground transition hover:border-brand hover:text-brand'
    : 'inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1.5 text-xs font-semibold text-foreground transition hover:border-brand hover:text-brand';

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        className={buttonClass}
        aria-label={`${t('label')}: ${t(locale)}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open ? activeId : undefined}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={onButtonKeyDown}
      >
        <GlobeIcon className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
        <span>{locale.toUpperCase()}</span>
      </button>

      {open && (
        <div
          className="absolute right-0 z-[60] mt-1.5 w-[min(18rem,calc(100vw-2rem))] rounded-xl border border-border bg-background py-1 shadow-lg"
        >
          <div id={listId} role="listbox" aria-label={t('label')}>
            {LANGUAGES.map((option, index) => {
              const optionId = `${reactId}-${option.id}`;
              const available = Boolean(option.locale);
              const selected = option.locale === locale;
              const isHighlighted = index === highlighted;
              const rowClass = [
                'flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm',
                isHighlighted ? 'bg-surface' : '',
                available
                  ? 'text-foreground transition hover:bg-surface hover:text-brand'
                  : 'cursor-default text-foreground/40',
                selected ? 'font-semibold' : '',
              ]
                .filter(Boolean)
                .join(' ');

              const label = (
                <span dir={option.dir} lang={option.lang} className="min-w-0 truncate">
                  {option.name}
                </span>
              );

              if (option.locale) {
                const href = withLocalePrefix(pathname, option.locale);
                return (
                  <a
                    key={option.id}
                    id={optionId}
                    href={href}
                    hrefLang={option.locale}
                    role="option"
                    aria-selected={selected}
                    aria-label={t(option.locale)}
                    data-locale-switch={option.locale}
                    className={rowClass}
                    onMouseEnter={() => setHighlighted(index)}
                    onPointerDown={() => {
                      if (option.locale === locale) setOpen(false);
                    }}
                  >
                    {label}
                    {selected ? <span className="text-[10px] font-semibold text-brand">●</span> : null}
                  </a>
                );
              }

              return (
                <div
                  key={option.id}
                  id={optionId}
                  role="option"
                  aria-selected={false}
                  aria-disabled="true"
                  className={rowClass}
                  onMouseEnter={() => setHighlighted(index)}
                  onClick={showUnavailableNotice}
                >
                  {label}
                  <span className="shrink-0 rounded-full bg-surface px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-foreground/50">
                    {t('comingSoon')}
                  </span>
                </div>
              );
            })}
          </div>
          {notice ? (
            <p className="border-t border-border px-3 py-2 text-xs text-foreground/70" role="status" aria-live="polite">
              {notice}
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
