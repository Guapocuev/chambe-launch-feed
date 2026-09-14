import { getTranslations } from 'next-intl/server';
import { ContractorLoginForm } from '@/app/[locale]/contractor/ContractorLoginForm';
import { isSupabaseConfigured } from '@/lib/config';

export async function generateMetadata() {
  const t = await getTranslations('Auth');
  return { title: t('loginTitle'), robots: { index: false, follow: false } };
}

export const dynamic = 'force-dynamic';

export default async function ApprenticeLoginPage() {
  const t = await getTranslations('Auth');
  return (
    <div className="mx-auto w-full max-w-md px-5 py-10 sm:py-16">
      <p className="text-sm font-semibold uppercase tracking-wide text-foreground/50">{t('apprentices')}</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">{t('loginTitle')}</h1>
      <p className="mt-3 text-base leading-relaxed text-foreground/70">{t('apprenticeLoginBody')}</p>
      <div className="mt-8">
        {isSupabaseConfigured() ? (
          <ContractorLoginForm
            homePath="/apprentice"
            callbackPath="/apprentice/auth/callback"
            verifyLabel={t('hoursTitle')}
            applyHref=""
            emailHint={t('emailHintApprentice')}
            altHref="/contractor/login"
            altLabel={t('contractorLogin')}
          />
        ) : (
          <p className="rounded-2xl border border-border bg-surface px-4 py-4 text-base text-foreground/75">
            {t('notConfiguredShort')}
          </p>
        )}
      </div>
    </div>
  );
}
