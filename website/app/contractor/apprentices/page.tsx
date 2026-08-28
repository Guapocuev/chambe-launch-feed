import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { loadSupervisedApprentices } from '@/app/apprentice/actions';
import { resolveContractorSession } from '../actions';
import { SupervisorApprentices } from './SupervisorApprentices';
import { createServerSupabase } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Apprentices',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function ContractorApprenticesPage() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/contractor/login');

  const session = await resolveContractorSession();
  if (!session.ok || session.status !== 'ok') {
    redirect('/contractor');
  }

  const roster = await loadSupervisedApprentices();
  if (!roster.ok) {
    return (
      <div className="mx-auto max-w-md px-5 py-12">
        <Link href="/contractor" className="inline-flex min-h-12 items-center text-base font-semibold">
          ← Jobs
        </Link>
        <h1 className="mt-6 text-2xl font-bold">Could not load apprentices</h1>
        <p className="mt-3 text-base text-foreground/70">{roster.error}</p>
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto max-w-md px-5 pt-6">
        <Link href="/contractor" className="inline-flex min-h-12 items-center text-base font-semibold">
          ← Jobs
        </Link>
      </div>
      <SupervisorApprentices apprentices={roster.apprentices} pending={roster.pending} />
    </>
  );
}
