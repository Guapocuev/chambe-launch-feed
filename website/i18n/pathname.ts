import { routing, type AppLocale } from './routing';

export function stripLocalePrefix(pathname: string): string {
  for (const locale of routing.locales) {
    if (pathname === `/${locale}`) return '/';
    if (pathname.startsWith(`/${locale}/`)) {
      return pathname.slice(locale.length + 1);
    }
  }
  return pathname;
}

export function localeFromPathname(pathname: string): AppLocale {
  for (const locale of routing.locales) {
    if (locale === routing.defaultLocale) continue;
    if (pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)) {
      return locale;
    }
  }
  return routing.defaultLocale;
}

export function withLocalePrefix(pathname: string, locale: string): string {
  const path = pathname.startsWith('/') ? pathname : `/${pathname}`;
  if (locale === routing.defaultLocale) return path;
  return path === '/' ? `/${locale}` : `/${locale}${path}`;
}

export function htmlLang(locale: string): string {
  if (locale === 'es') return 'es';
  if (locale === 'pt') return 'pt';
  return 'en-CA';
}

export function localeFromDocumentCookie(): AppLocale {
  if (typeof document === 'undefined') return routing.defaultLocale;
  const match = document.cookie.match(/(?:^|; )NEXT_LOCALE=([^;]*)/);
  const value = match?.[1];
  return (routing.locales as readonly string[]).includes(value ?? '')
    ? (value as AppLocale)
    : routing.defaultLocale;
}

export function isAuthCallbackPath(pathname: string): boolean {
  const path = stripLocalePrefix(pathname);
  return (
    path.startsWith('/contractor/auth/') ||
    path.startsWith('/apprentice/auth/') ||
    path.startsWith('/visualize/auth/')
  );
}

export function isStripeVisualizeReturnPath(pathname: string, searchParams: URLSearchParams): boolean {
  const path = stripLocalePrefix(pathname);
  if (path !== '/visualize') return false;
  return searchParams.has('paid') || searchParams.has('checkout') || searchParams.has('canceled');
}
