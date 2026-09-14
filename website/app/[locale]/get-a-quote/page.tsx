import { getTranslations } from 'next-intl/server';
import { QuoteForm } from './QuoteForm';
import { pageMetadata } from '@/lib/metadata';
import { CALLBACK_MINUTES, CONTRACTOR_ACCEPT_MINUTES } from '@/lib/response-time';

export async function generateMetadata() {
  const t = await getTranslations('Quote');
  return pageMetadata(t('title'), t('intro'), '/get-a-quote');
}

export default async function GetAQuotePage() {
  const t = await getTranslations('Quote');
  const tTime = await getTranslations('ResponseTime');
  return (
    <div className="mx-auto max-w-2xl px-6 py-20">
      <h1 className="text-4xl font-bold tracking-tight text-foreground">{t('title')}</h1>
      <p className="mt-4 text-lg text-foreground/70">
        {t('intro')} {tTime('matchWindow', { minutes: CONTRACTOR_ACCEPT_MINUTES })}{' '}
        {tTime('callbackWindow', { hours: tTime('businessHours'), minutes: CALLBACK_MINUTES })}
      </p>
      <div className="mt-10">
        <QuoteForm />
      </div>
    </div>
  );
}
