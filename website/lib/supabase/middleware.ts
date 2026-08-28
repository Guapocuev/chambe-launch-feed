import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { isApprenticeArea, isAppArea } from '@/lib/contractor-area';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '@/lib/config';

export async function updateContractorSession(request: NextRequest) {
  let response = NextResponse.next({ request });

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
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  if (!isAppArea(path)) return response;

  const isPublic =
    path === '/contractor/login' ||
    path.startsWith('/contractor/auth/') ||
    path === '/apprentice/login' ||
    path.startsWith('/apprentice/auth/');

  if (!user && !isPublic) {
    const login = request.nextUrl.clone();
    login.pathname = isApprenticeArea(path) ? '/apprentice/login' : '/contractor/login';
    login.search = '';
    return NextResponse.redirect(login);
  }

  if (user && (path === '/contractor/login' || path === '/apprentice/login')) {
    const home = request.nextUrl.clone();
    home.pathname = isApprenticeArea(path) ? '/apprentice' : '/contractor';
    home.search = '';
    return NextResponse.redirect(home);
  }

  return response;
}
