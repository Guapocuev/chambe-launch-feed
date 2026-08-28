import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { JobTools } from '../../JobTools';
import { resolveContractorSession } from '../../actions';
import { createServerSupabase } from '@/lib/supabase/server';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '@/lib/config';

export const metadata: Metadata = {
  title: 'Job',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function ContractorJobPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    redirect('/contractor/login');
  }
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect('/contractor/login');
  }

  if (!UUID_RE.test(jobId)) {
    return (
      <div className="mx-auto max-w-md px-5 py-12">
        <h1 className="text-xl font-semibold text-foreground">That job link is not valid</h1>
        <Link href="/contractor" className="mt-6 flex h-14 items-center justify-center rounded-2xl bg-accent text-lg font-semibold text-inverse">
          Back to jobs
        </Link>
      </div>
    );
  }

  const session = await resolveContractorSession();
  if (!session.ok || session.status !== 'ok') {
    redirect('/contractor');
  }

  return (
    <div className="mx-auto max-w-lg px-5 py-6 sm:py-10">
      <Link href="/contractor" className="inline-flex min-h-12 items-center text-base font-semibold text-foreground">
        ← All jobs
      </Link>
      <div className="mt-4">
        <JobTools contractorId={session.contractor.id} jobId={jobId} />
      </div>
    </div>
  );
}
