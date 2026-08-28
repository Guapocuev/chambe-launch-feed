'use client';

import { createBrowserSupabase } from '@/lib/supabase/client';

export async function completeContractorLoginFromUrl(): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = createBrowserSupabase();
  const url = new URL(window.location.href);
  const code = url.searchParams.get('code');

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return { ok: false, error: error.message };
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
