import { routing } from '@/i18n/routing';

export function formatCad(amount: number, locale: string): string {
  const tag = locale === 'es' ? 'es-CA' : 'en-CA';
  return new Intl.NumberFormat(tag, {
    style: 'currency',
    currency: 'CAD',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function htmlLocale(locale: string): string {
  return locale === 'es' ? 'es-CA' : 'en-CA';
}

export function localeAlternates(path: string): Record<string, string> {
  const normalized = path === '/' ? '' : path.startsWith('/') ? path : `/${path}`;
  return {
    'en-CA': normalized || '/',
    es: `/es${normalized || ''}`,
    'x-default': normalized || '/',
  };
}

export function isAppLocale(value: string): value is (typeof routing.locales)[number] {
  return (routing.locales as readonly string[]).includes(value);
}
