import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ContractorAuthCallback } from '@/app/[locale]/contractor/ContractorAuthCallback';

export const metadata: Metadata = {
  title: 'Signing in',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function VisualizeAuthCallbackPage() {
  const t = await getTranslations('Visualize');
  return (
    <ContractorAuthCallback
      homePath="/visualize"
      loginPath="/visualize/login"
      heading={t('opening')}
    />
  );
}
