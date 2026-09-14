import type { ReactNode } from 'react';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { redirectTo } from '@/i18n/redirect';
import { ContractorDashboard } from './ContractorDashboard';
import { resolveContractorSession, signOutContractor } from './actions';
import { createServerSupabase } from '@/lib/supabase/server';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '@/lib/config';

export async function generateMetadata() {
  const t = await getTranslations('Auth');
  return { title: t('jobsTitle'), robots: { index: false, follow: false } };
}

export const dynamic = 'force-dynamic';

export default async function ContractorHomePage() {
  const t = await getTranslations('Auth');

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return (
      <div className="mx-auto max-w-md px-5 py-12">
        <h1 className="text-2xl font-bold text-foreground">{t('notConfiguredShort')}</h1>
        <p className="mt-3 text-base text-foreground/70">{t('notConfigured')}</p>
      </div>
    );
  }

  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    await redirectTo('/contractor/login');
  }

  const result = await resolveContractorSession();
  const logOut = (
    <form action={signOutContractor}>
      <button type="submit" className="flex h-14 w-full items-center justify-center rounded-2xl border border-border text-base font-semibold text-foreground">
        {t('logOut')}
      </button>
    </form>
  );

  if (!result.ok) {
    return <Blocked title={t('loadJobsFail')} body={result.error} action={logOut} />;
  }
  if (result.status === 'not_found') {
    return (
      <Blocked
        title={t('notOnRoster')}
        body={t('notOnRosterBody')}
        action={
          <div className="space-y-3">
            <Link href="/apply" className="flex h-14 items-center justify-center rounded-2xl bg-accent text-lg font-semibold text-inverse">
              {t('apply')}
            </Link>
            {logOut}
          </div>
        }
      />
    );
  }
  if (result.status === 'rejected') {
    return <Blocked title={t('applicationInactive')} body={t('applicationInactiveBody')} action={logOut} />;
  }
  if (result.status === 'phone_taken') {
    return <Blocked title={t('phoneTaken')} body={t('phoneTakenBody')} action={logOut} />;
  }
  if (result.status !== 'ok') {
    return <Blocked title={t('loadJobsFail')} body={t('tryAgain')} action={logOut} />;
  }

  return <ContractorDashboard contractor={result.contractor} jobs={result.jobs} />;
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
