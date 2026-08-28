import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ContractorDashboard } from './ContractorDashboard';
import { resolveContractorSession, signOutContractor } from './actions';
import { createServerSupabase } from '@/lib/supabase/server';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '@/lib/config';

export const metadata: Metadata = {
  title: 'Your jobs',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function ContractorHomePage() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return (
      <div className="mx-auto max-w-md px-5 py-12">
        <h1 className="text-2xl font-bold text-foreground">Login is not configured</h1>
        <p className="mt-3 text-base text-foreground/70">
          Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY on the website, then
          reload.
        </p>
      </div>
    );
  }

  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect('/contractor/login');
  }

  const result = await resolveContractorSession();
  if (!result.ok) {
    return (
      <Blocked
        title="Could not load your jobs"
        body={result.error}
        action={<form action={signOutContractor}><SubmitLogOut /></form>}
      />
    );
  }
  if (result.status === 'not_found') {
    return (
      <Blocked
        title="We don’t have you on the roster yet"
        body="Use the same phone or email from your contractor application. If you have not applied, start there."
        action={
          <div className="space-y-3">
            <Link href="/apply" className="flex h-14 items-center justify-center rounded-2xl bg-accent text-lg font-semibold text-inverse">
              Apply to join
            </Link>
            <form action={signOutContractor}>
              <SubmitLogOut />
            </form>
          </div>
        }
      />
    );
  }
  if (result.status === 'rejected') {
    return (
      <Blocked
        title="This application is not active"
        body="If that seems wrong, email us and we will sort it out."
        action={<form action={signOutContractor}><SubmitLogOut /></form>}
      />
    );
  }
  if (result.status === 'phone_taken') {
    return (
      <Blocked
        title="This phone is already on another account"
        body="Log in with the original number or email from your application."
        action={<form action={signOutContractor}><SubmitLogOut /></form>}
      />
    );
  }
  if (result.status !== 'ok') {
    return (
      <Blocked
        title="Could not load your jobs"
        body="Sign out and try again with the phone or email on your application."
        action={<form action={signOutContractor}><SubmitLogOut /></form>}
      />
    );
  }

  return <ContractorDashboard contractor={result.contractor} jobs={result.jobs} />;
}

function SubmitLogOut() {
  return (
    <button type="submit" className="flex h-14 w-full items-center justify-center rounded-2xl border border-border text-base font-semibold text-foreground">
      Log out
    </button>
  );
}

function Blocked({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-md px-5 py-12">
      <h1 className="text-2xl font-bold text-foreground">{title}</h1>
      <p className="mt-3 text-base leading-relaxed text-foreground/70">{body}</p>
      <div className="mt-8">{action}</div>
    </div>
  );
}
