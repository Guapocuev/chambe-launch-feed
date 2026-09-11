'use client';

import { createBrowserClient } from '@supabase/ssr';
import { parse, serialize } from 'cookie';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '@/lib/config';

const PKCE_KEY = 'code-verifier';

function readDocumentCookies() {
  const parsed = parse(document.cookie);
  return Object.keys(parsed).map((name) => ({ name, value: parsed[name] ?? '' }));
}

function readPkceFromLocalStorage() {
  const items: { name: string; value: string }[] = [];
  for (let i = 0; i < window.localStorage.length; i += 1) {
    const name = window.localStorage.key(i);
    if (!name?.includes(PKCE_KEY)) continue;
    const value = window.localStorage.getItem(name);
    if (value != null) items.push({ name, value });
  }
  return items;
}

export function createBrowserSupabase() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase is not configured.');
  }

  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      // Exchange happens in complete-login. Auto-detect would consume the
      // verifier first, then the explicit exchange would fail with
      // "PKCE code verifier not found in storage."
      detectSessionInUrl: false,
      persistSession: true,
      flowType: 'pkce',
    },
    cookies: {
      getAll() {
        const byName = new Map<string, { name: string; value: string }>();
        for (const cookie of readDocumentCookies()) {
          byName.set(cookie.name, cookie);
        }
        for (const item of readPkceFromLocalStorage()) {
          byName.set(item.name, item);
        }
        return [...byName.values()];
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          document.cookie = serialize(name, value, options);
          if (!name.includes(PKCE_KEY)) continue;
          if (!value || options.maxAge === 0) {
            window.localStorage.removeItem(name);
          } else {
            window.localStorage.setItem(name, value);
          }
        }
      },
    },
  });
}
