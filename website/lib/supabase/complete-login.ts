'use client';

import { createBrowserSupabase } from '@/lib/supabase/client';

const PKCE_FLOW_ID_PARAM = 'sb_flow_id';

function stripAuthParams(url: URL) {
  url.searchParams.delete('code');
  url.searchParams.delete(PKCE_FLOW_ID_PARAM);
  window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
}

export async function completeContractorLoginFromUrl(): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = createBrowserSupabase();
  const url = new URL(window.location.href);
  const code = url.searchParams.get('code');

  if (code) {
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
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (error) return { ok: false, error: error.message };
    window.history.replaceState({}, '', `${url.pathname}${url.search}`);
    return { ok: true };
  }

  const { data, error } = await supabase.auth.getSession();
  if (error) return { ok: false, error: error.message };
  if (data.session) return { ok: true };
  return { ok: false, error: 'That login link expired. Ask for a new one.' };
}
