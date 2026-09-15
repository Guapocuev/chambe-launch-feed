import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { ApplyForm } from './ApplyForm';
import { ContractorSupport } from '@/components/ContractorSupport';
import { pageMetadata } from '@/lib/metadata';

export async function generateMetadata() {
  const t = await getTranslations('Apply');
  const tTime = await getTranslations('ResponseTime');
  return pageMetadata(t('title'), t('intro', { callback: tTime('applicantCallback') }), '/apply');
}

export default async function ApplyPage() {
  const t = await getTranslations('Apply');
  const tTime = await getTranslations('ResponseTime');
  const callback = tTime('applicantCallback');

  return (
    <div className="mx-auto max-w-2xl px-6 py-20">
      <h1 className="text-4xl font-bold tracking-tight text-foreground">{t('title')}</h1>
      <p className="mt-4 text-lg text-foreground/70">{t('intro', { callback })}</p>
      <ul className="mt-6 space-y-2 text-sm text-foreground/80">
        <li>{t('bullet1')}</li>
        <li>{t('bullet2')}</li>
        <li>{t('bullet3', { callback })}</li>
      </ul>
      <ContractorSupport />
      <div id="apply" className="mt-10 scroll-mt-24">
        <ApplyForm />
      </div>
      <p className="mt-8 text-sm text-foreground/50">
        {t('alreadyCrew')}{' '}
        <Link href="/contractor/login" className="font-medium text-foreground underline-offset-2 hover:underline">
          {t('login')}
        </Link>{' '}
        {t('loginHint')}
      </p>
    </div>
  );
}
