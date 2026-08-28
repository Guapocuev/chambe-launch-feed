import type { Metadata } from 'next';
import { ContractorLoginForm } from '@/app/contractor/ContractorLoginForm';
import { isSupabaseConfigured } from '@/lib/config';

export const metadata: Metadata = {
  title: 'Apprentice login',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default function ApprenticeLoginPage() {
  return (
    <div className="mx-auto w-full max-w-md px-5 py-10 sm:py-16">
      <p className="text-sm font-semibold uppercase tracking-wide text-foreground/50">Apprentices</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">Log in</h1>
      <p className="mt-3 text-base leading-relaxed text-foreground/70">
        We text you a code. No password. You land on your hours.
      </p>
      <div className="mt-8">
        {isSupabaseConfigured() ? (
          <ContractorLoginForm
            homePath="/apprentice"
            callbackPath="/apprentice/auth/callback"
            verifyLabel="Open my hours"
            applyHref=""
            emailHint="Enter the email your supervisor used for you."
            altHref="/contractor/login"
            altLabel="Contractor login"
          />
        ) : (
          <p className="rounded-2xl border border-border bg-surface px-4 py-4 text-base text-foreground/75">
            Login is not configured on this site yet.
          </p>
        )}
      </div>
    </div>
  );
}
