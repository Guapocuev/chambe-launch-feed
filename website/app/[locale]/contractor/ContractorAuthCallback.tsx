'use client';

import { useEffect, useState } from 'react';
import { localeFromDocumentCookie, withLocalePrefix } from '@/i18n/pathname';
import { completeContractorLoginFromUrl } from '@/lib/supabase/complete-login';

export function ContractorAuthCallback({
  homePath = '/contractor',
  loginPath = '/contractor/login',
  heading = 'Opening your jobs…',
}: {
  homePath?: string;
  loginPath?: string;
  heading?: string;
}) {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      if (!cancelled) setError('That login link expired. Ask for a new one.');
    }, 20000);

    void completeContractorLoginFromUrl()
      .then((result) => {
        if (cancelled) return;
        window.clearTimeout(timer);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        window.location.replace(withLocalePrefix(homePath, localeFromDocumentCookie()));
      })
      .catch((err) => {
        if (cancelled) return;
        window.clearTimeout(timer);
        setError(err instanceof Error ? err.message : 'That login link expired. Ask for a new one.');
      });

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [homePath]);

  return (
    <div className="mx-auto w-full max-w-md px-5 py-16">
      <h1 className="text-2xl font-bold text-foreground">{heading}</h1>
      {error ? (
        <>
          <p className="mt-3 text-base text-red-700 dark:text-red-300">{error}</p>
          <a
            href={withLocalePrefix(loginPath, localeFromDocumentCookie())}
            className="mt-8 flex h-14 items-center justify-center rounded-2xl bg-accent text-lg font-semibold text-inverse"
          >
            Back to log in
          </a>
        </>
      ) : (
        <p className="mt-3 text-base text-foreground/70">Hang on — no extra setup.</p>
      )}
    </div>
  );
}
