'use client';

import { localeFromDocumentCookie } from '@/i18n/pathname';
import { createBrowserSupabase } from '@/lib/supabase/client';

const PKCE_FLOW_ID_PARAM = 'sb_flow_id';

let inFlight: Promise<{ ok: true } | { ok: false; error: string }> | null = null;

function stripAuthParams(url: URL) {
  url.searchParams.delete('code');
  url.searchParams.delete(PKCE_FLOW_ID_PARAM);
  url.searchParams.delete('token_hash');
  url.searchParams.delete('type');
  window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
}

async function establishSessionOnServer(body: Record<string, string>): Promise<{ ok: true } | { ok: false; error: string }> {
  const res = await fetch('/api/auth/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(body),
  });
  const payload = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
  if (!res.ok || !payload?.ok) {
    return { ok: false, error: payload?.error ?? 'That login link expired. Ask for a new one.' };
  }
  return { ok: true };
}

export async function completeContractorLoginFromUrl(): Promise<{ ok: true } | { ok: false; error: string }> {
  if (inFlight) return inFlight;
  inFlight = completeOnce();
  return inFlight;
}

async function completeOnce(): Promise<{ ok: true } | { ok: false; error: string }> {
  const url = new URL(window.location.href);
  const code = url.searchParams.get('code');
  const tokenHash = url.searchParams.get('token_hash');

  if (tokenHash) {
    const next = localeFromDocumentCookie() === 'es' ? '/es/contractor' : '/contractor';
    const params = new URLSearchParams({
      token_hash: tokenHash,
      type: url.searchParams.get('type') ?? 'email',
      next,
    });
    window.location.replace(`/api/auth/session?${params.toString()}`);
    return new Promise(() => undefined);
  }

  if (code) {
    const supabase = createBrowserSupabase();
    const flowId = url.searchParams.get(PKCE_FLOW_ID_PARAM);
    const { error } = await supabase.auth.exchangeCodeForSession(
      code,
      flowId ? { flowId } : undefined,
    );
    if (error) {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        stripAuthParams(url);
        return { ok: true };
      }
      return { ok: false, error: error.message };
    }
    stripAuthParams(url);
    return { ok: true };
  }

  const hash = url.hash.startsWith('#') ? url.hash.slice(1) : url.hash;
  const hashParams = new URLSearchParams(hash);
  const accessToken = hashParams.get('access_token');
  const refreshToken = hashParams.get('refresh_token');
  if (accessToken && refreshToken) {
    const result = await establishSessionOnServer({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (result.ok) window.history.replaceState({}, '', `${url.pathname}${url.search}`);
    return result;
  }

  const supabase = createBrowserSupabase();
  const { data, error } = await supabase.auth.getSession();
  if (error) return { ok: false, error: error.message };
  if (data.session) return { ok: true };
  return { ok: false, error: 'That login link expired. Ask for a new one.' };
}
