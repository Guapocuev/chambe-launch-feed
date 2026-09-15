import { getTranslations } from 'next-intl/server';
import { ContractorLoginForm } from '@/app/[locale]/contractor/ContractorLoginForm';
import { isSupabaseConfigured } from '@/lib/config';
import { VisualizeShowcase } from '../VisualizeShowcase';

export async function generateMetadata() {
  const t = await getTranslations('Visualize');
  return { title: t('loginTitle'), robots: { index: false, follow: false } };
}

export const dynamic = 'force-dynamic';

export default async function VisualizeLoginPage() {
  const t = await getTranslations('Visualize');
  const tAuth = await getTranslations('Auth');
  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-10 sm:py-16">
      <p className="text-sm font-semibold uppercase tracking-wide text-foreground/50">{t('loginKicker')}</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">{t('loginTitle')}</h1>
      <p className="mt-3 text-base leading-relaxed text-foreground/70">{t('loginBody')}</p>
      <div className="mt-8">
        <VisualizeShowcase />
      </div>
      <div className="mx-auto mt-10 max-w-md">
        {isSupabaseConfigured() ? (
          <ContractorLoginForm
            homePath="/visualize"
            callbackPath="/visualize/auth/callback"
            verifyLabel={tAuth('visualizeVerify')}
            applyHref="/get-a-quote"
            applyLabel={tAuth('quoteInstead')}
            emailHint={tAuth('emailHintVisualize')}
            initialMode="email"
          />
        ) : (
          <p className="rounded-2xl border border-border bg-surface px-4 py-4 text-base text-foreground/75">
            {tAuth('notConfiguredShort')}
          </p>
        )}
      </div>
    </div>
  );
}
