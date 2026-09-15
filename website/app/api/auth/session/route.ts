import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '@/lib/config';
import { cookieOptionsForOrigin } from '@/lib/supabase/cookie-options';
import { withLocalePrefix } from '@/i18n/pathname';
import { isAppLocale } from '@/lib/format-cad';

type EmailOtpType = 'signup' | 'invite' | 'magiclink' | 'recovery' | 'email_change' | 'email';

const OTP_TYPES = new Set<EmailOtpType>([
  'signup',
  'invite',
  'magiclink',
  'recovery',
  'email_change',
  'email',
]);

function otpType(value: unknown): EmailOtpType {
  return typeof value === 'string' && OTP_TYPES.has(value as EmailOtpType)
    ? (value as EmailOtpType)
    : 'email';
}

function requestOrigin(request: Request): string {
  const url = new URL(request.url);
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || url.host;
  const proto = (request.headers.get('x-forwarded-proto') || url.protocol.replace(':', '')).replace(/:$/, '');
  return `${proto}://${host}`;
}

function safeNextPath(raw: string | null, locale: string | undefined): string {
  if (raw && raw.startsWith('/') && !raw.startsWith('//') && !raw.includes('\\')) {
    return raw;
  }
  const code = locale && isAppLocale(locale) ? locale : 'en';
  return withLocalePrefix('/contractor', code);
}

function redirectTo(request: Request, path: string) {
  return NextResponse.redirect(`${requestOrigin(request)}${path}`);
}

async function supabaseFromRequest(request: Request) {
  const protocol = new URL(request.url).protocol;
  const cookieStore = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          cookieStore.set(name, value, cookieOptionsForOrigin(options, protocol));
        }
      },
    },
  });
}

export async function GET(request: Request) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return redirectTo(request, '/contractor/login');
  }

  const url = new URL(request.url);
  const tokenHash = url.searchParams.get('token_hash') ?? '';
  const cookieStore = await cookies();
  const next = safeNextPath(url.searchParams.get('next'), cookieStore.get('NEXT_LOCALE')?.value);

  if (!tokenHash) {
    return redirectTo(request, next.startsWith('/es/') ? '/es/contractor/login' : '/contractor/login');
  }

  const supabase = await supabaseFromRequest(request);
  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: otpType(url.searchParams.get('type')),
  });
  if (error) {
    const login = next.startsWith('/es/') ? '/es/contractor/login' : '/contractor/login';
    return redirectTo(request, login);
  }
  return redirectTo(request, next);
}

export async function POST(request: Request) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return NextResponse.json({ ok: false, error: 'Supabase is not configured.' }, { status: 503 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: 'That login link expired. Ask for a new one.' }, { status: 400 });
  }

  const supabase = await supabaseFromRequest(request);
  const tokenHash = typeof body.token_hash === 'string' ? body.token_hash : '';
  const accessToken = typeof body.access_token === 'string' ? body.access_token : '';
  const refreshToken = typeof body.refresh_token === 'string' ? body.refresh_token : '';

  if (tokenHash) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: otpType(body.type),
    });
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 401 });
    return NextResponse.json({ ok: true });
  }

  if (accessToken && refreshToken) {
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 401 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: false, error: 'That login link expired. Ask for a new one.' }, { status: 400 });
}
