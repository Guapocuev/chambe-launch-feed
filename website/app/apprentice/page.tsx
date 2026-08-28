import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { ApprenticeHome } from './ApprenticeHome';
import { ApprenticeJoinForm } from './ApprenticeJoinForm';
import { resolveApprenticeSession, signOutApprentice } from './actions';
import { createServerSupabase } from '@/lib/supabase/server';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '@/lib/config';

export const metadata: Metadata = {
  title: 'Your hours',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function ApprenticeHomePage() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return (
      <div className="mx-auto max-w-md px-5 py-12">
        <h1 className="text-2xl font-bold text-foreground">Login is not configured</h1>
      </div>
    );
  }

  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/apprentice/login');

  const result = await resolveApprenticeSession();
  if (!result.ok) {
    return (
      <div className="mx-auto max-w-md px-5 py-12">
        <h1 className="text-2xl font-bold text-foreground">Could not load your hours</h1>
        <p className="mt-3 text-base text-foreground/70">{result.error}</p>
        <form action={signOutApprentice} className="mt-8">
          <button type="submit" className="flex h-14 w-full items-center justify-center rounded-2xl border border-border text-base font-semibold">
            Log out
          </button>
        </form>
      </div>
    );
  }
  if (result.status === 'needs_join') {
    return <ApprenticeJoinForm />;
  }
  return <ApprenticeHome dashboard={result.dashboard} />;
}
