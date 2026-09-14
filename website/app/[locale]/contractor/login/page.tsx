import { getTranslations } from 'next-intl/server';
import { ContractorLoginForm } from '../ContractorLoginForm';
import { isSupabaseConfigured } from '@/lib/config';

export async function generateMetadata() {
  const t = await getTranslations('Auth');
  return { title: t('loginTitle'), robots: { index: false, follow: false } };
}

export const dynamic = 'force-dynamic';

export default async function ContractorLoginPage() {
  const t = await getTranslations('Auth');
  return (
    <div className="mx-auto w-full max-w-md px-5 py-10 sm:py-16">
      <p className="text-sm font-semibold uppercase tracking-wide text-foreground/50">{t('contractors')}</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">{t('loginTitle')}</h1>
      <p className="mt-3 text-base leading-relaxed text-foreground/70">{t('loginBody')}</p>
      <div className="mt-8">
        {isSupabaseConfigured() ? (
          <ContractorLoginForm
            altHref="/apprentice/login"
            altLabel={t('apprenticeLogin')}
            applyLabel={t('apply')}
            verifyLabel={t('jobsTitle')}
            emailHint={t('emailHintContractor')}
          />
        ) : (
          <p className="rounded-2xl border border-border bg-surface px-4 py-4 text-base text-foreground/75">
            {t('notConfigured')}
          </p>
        )}
      </div>
    </div>
  );
}
