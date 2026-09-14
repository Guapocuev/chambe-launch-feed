import { type NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import {
  isAuthCallbackPath,
  isStripeVisualizeReturnPath,
  localeFromPathname,
  stripLocalePrefix,
} from '@/i18n/pathname';
import { routing } from '@/i18n/routing';
import { updateContractorSession } from '@/lib/supabase/middleware';

const handleI18nRouting = createMiddleware(routing);

function isI18nExempt(request: NextRequest): boolean {
  const { pathname, searchParams } = request.nextUrl;
  return isAuthCallbackPath(pathname) || isStripeVisualizeReturnPath(pathname, searchParams);
}

/** Keep public URL unprefixed; serve the default-locale [locale] page. */
function rewriteToDefaultLocale(request: NextRequest): NextResponse {
  const url = request.nextUrl.clone();
  const path = stripLocalePrefix(url.pathname);
  url.pathname = path === '/' ? `/${routing.defaultLocale}` : `/${routing.defaultLocale}${path}`;
  return NextResponse.rewrite(url);
}

function unprefixAuthOrStripe(request: NextRequest): NextResponse | null {
  const { pathname, searchParams } = request.nextUrl;
  const locale = localeFromPathname(pathname);
  if (locale === routing.defaultLocale) return null;
  if (!isAuthCallbackPath(pathname) && !isStripeVisualizeReturnPath(pathname, searchParams)) {
    return null;
  }
  const url = request.nextUrl.clone();
  url.pathname = stripLocalePrefix(pathname);
  return NextResponse.redirect(url);
}

export async function proxy(request: NextRequest) {
  const unprefix = unprefixAuthOrStripe(request);
  if (unprefix) return unprefix;

  if (isI18nExempt(request)) {
    return updateContractorSession(request, rewriteToDefaultLocale(request));
  }

  const i18nResponse = handleI18nRouting(request);
  return updateContractorSession(request, i18nResponse);
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
