'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
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
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void completeContractorLoginFromUrl().then((result) => {
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.replace(homePath);
      router.refresh();
    });
  }, [router, homePath]);

  return (
    <div className="mx-auto w-full max-w-md px-5 py-16">
      <h1 className="text-2xl font-bold text-foreground">{heading}</h1>
      {error ? (
        <>
          <p className="mt-3 text-base text-red-700 dark:text-red-300">{error}</p>
          <a
            href={loginPath}
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
