import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { localeFromPathname, stripLocalePrefix, withLocalePrefix } from '@/i18n/pathname';
import { isApprenticeArea, isAppArea, isVisualizeArea } from '@/lib/contractor-area';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '@/lib/config';
import { cookieOptionsForOrigin } from '@/lib/supabase/cookie-options';

function copyCookies(from: NextResponse, to: NextResponse): NextResponse {
  for (const cookie of from.cookies.getAll()) {
    to.cookies.set(cookie);
  }
  return to;
}

export async function updateContractorSession(request: NextRequest, response: NextResponse) {
  if (response.status >= 300 && response.status < 400) {
    return attachSupabaseCookies(request, response);
  }

  return applyAuthGates(request, await attachSupabaseCookies(request, response));
}

async function attachSupabaseCookies(request: NextRequest, response: NextResponse): Promise<NextResponse> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return response;
  }

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, cookieOptionsForOrigin(options, request.nextUrl.protocol));
        }
      },
    },
  });

  await supabase.auth.getUser();
  return response;
}

async function applyAuthGates(request: NextRequest, response: NextResponse): Promise<NextResponse> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return response;
  }

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, cookieOptionsForOrigin(options, request.nextUrl.protocol));
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const locale = localeFromPathname(request.nextUrl.pathname);
  const path = stripLocalePrefix(request.nextUrl.pathname);
  if (!isAppArea(path)) return response;

  const isPublic =
    path === '/contractor/login' ||
    path.startsWith('/contractor/auth/') ||
    path === '/apprentice/login' ||
    path.startsWith('/apprentice/auth/') ||
    path === '/visualize/login' ||
    path.startsWith('/visualize/auth/');

  if (!user && !isPublic) {
    const login = request.nextUrl.clone();
    const loginPath = isVisualizeArea(path)
      ? '/visualize/login'
      : isApprenticeArea(path)
        ? '/apprentice/login'
        : '/contractor/login';
    login.pathname = withLocalePrefix(loginPath, locale);
    login.search = '';
    return copyCookies(response, NextResponse.redirect(login));
  }

  if (user && (path === '/contractor/login' || path === '/apprentice/login' || path === '/visualize/login')) {
    const home = request.nextUrl.clone();
    const homePath = isVisualizeArea(path) ? '/visualize' : isApprenticeArea(path) ? '/apprentice' : '/contractor';
    home.pathname = withLocalePrefix(homePath, locale);
    home.search = '';
    return copyCookies(response, NextResponse.redirect(home));
  }

  return response;
}
