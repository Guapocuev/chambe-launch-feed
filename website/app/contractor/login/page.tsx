import type { Metadata } from 'next';
import { ContractorLoginForm } from '../ContractorLoginForm';
import { isSupabaseConfigured } from '@/lib/config';

export const metadata: Metadata = {
  title: 'Contractor login',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default function ContractorLoginPage() {
  return (
    <div className="mx-auto w-full max-w-md px-5 py-10 sm:py-16">
      <p className="text-sm font-semibold uppercase tracking-wide text-foreground/50">Contractors</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">Log in</h1>
      <p className="mt-3 text-base leading-relaxed text-foreground/70">
        We text you a code. No password to remember. You land on your jobs.
      </p>
      <div className="mt-8">
        {isSupabaseConfigured() ? (
          <ContractorLoginForm altHref="/apprentice/login" altLabel="Apprentice login" />
        ) : (
          <p className="rounded-2xl border border-border bg-surface px-4 py-4 text-base text-foreground/75">
            Login is not configured on this site yet. Set NEXT_PUBLIC_SUPABASE_URL and
            NEXT_PUBLIC_SUPABASE_ANON_KEY, then reload.
          </p>
        )}
      </div>
    </div>
  );
}
