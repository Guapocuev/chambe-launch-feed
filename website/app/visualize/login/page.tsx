import type { Metadata } from 'next';
import { ContractorLoginForm } from '@/app/contractor/ContractorLoginForm';
import { isSupabaseConfigured } from '@/lib/config';

export const metadata: Metadata = {
  title: 'Kitchen preview login',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default function VisualizeLoginPage() {
  return (
    <div className="mx-auto w-full max-w-md px-5 py-10 sm:py-16">
      <p className="text-sm font-semibold uppercase tracking-wide text-foreground/50">Homeowners</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">Preview your kitchen</h1>
      <p className="mt-3 text-base leading-relaxed text-foreground/70">
        Email us a magic link. This login is only for the kitchen preview — it is not a contractor
        account.
      </p>
      <div className="mt-8">
        {isSupabaseConfigured() ? (
          <ContractorLoginForm
            homePath="/visualize"
            callbackPath="/visualize/auth/callback"
            verifyLabel="Open my preview"
            applyHref="/get-a-quote"
            applyLabel="Get a repair estimate instead"
            emailHint="Use the email you want the preview receipt sent to."
            initialMode="email"
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
