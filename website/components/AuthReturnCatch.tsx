'use client';

import { useEffect } from 'react';
import { isAuthCallbackPath, localeFromDocumentCookie, withLocalePrefix } from '@/i18n/pathname';
import { completeContractorLoginFromUrl } from '@/lib/supabase/complete-login';
import { resumeIdFromAuthLocation, takeAuthReturnTo } from '@/lib/supabase/auth-redirect';

function hasAuthReturnParams(): boolean {
  const url = new URL(window.location.href);
  if (url.searchParams.has('code') || url.searchParams.has('token_hash')) return true;
  const hash = url.hash.startsWith('#') ? url.hash.slice(1) : url.hash;
  const hashParams = new URLSearchParams(hash);
  return Boolean(hashParams.get('access_token') && hashParams.get('refresh_token'));
}

function fallbackReturnPath(): string {
  const resume = resumeIdFromAuthLocation(window.location.href);
  if (resume) return `/visualize?resume=${encodeURIComponent(resume)}`;
  return '/';
}

/** If Supabase falls back to the Site URL (homepage), still finish login and resume visualize. */
export function AuthReturnCatch() {
  useEffect(() => {
    if (!hasAuthReturnParams()) return;
    if (isAuthCallbackPath(window.location.pathname)) return;

    void completeContractorLoginFromUrl().then((result) => {
      if (!result.ok) return;
      const next = takeAuthReturnTo() || fallbackReturnPath();
      window.location.replace(withLocalePrefix(next, localeFromDocumentCookie()));
    });
  }, []);

  return null;
}
