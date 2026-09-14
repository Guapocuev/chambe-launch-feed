import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { pageMetadata } from '@/lib/metadata';
import { CONTACT_EMAIL } from '@/lib/site';
import { CALLBACK_MINUTES, CONTRACTOR_ACCEPT_MINUTES } from '@/lib/response-time';

export async function generateMetadata() {
  const t = await getTranslations('Contact');
  return pageMetadata(t('title'), t('intro'), '/contact');
}

export default async function ContactPage() {
  const t = await getTranslations('Contact');
  const tTime = await getTranslations('ResponseTime');
  const match = tTime('matchWindow', { minutes: CONTRACTOR_ACCEPT_MINUTES });
  const callback = tTime('callbackWindow', {
    hours: tTime('businessHours'),
    minutes: CALLBACK_MINUTES,
  });
  const applicant = tTime('applicantWindow', { callback: tTime('applicantCallback') });

  return (
    <div className="mx-auto max-w-3xl px-6 py-20">
      <h1 className="text-4xl font-bold tracking-tight text-foreground">{t('title')}</h1>
      <p className="mt-4 text-lg text-foreground/70">{t('intro')}</p>

      <div className="mt-10 rounded-2xl border border-border p-6">
        <div className="text-sm font-semibold uppercase tracking-wide text-foreground/50">{t('emailLabel')}</div>
        <a href={`mailto:${CONTACT_EMAIL}`} className="mt-1 block text-lg font-medium text-brand hover:underline">
          {CONTACT_EMAIL}
        </a>
        <p className="mt-2 text-sm text-foreground/60">{t('emailHelp')}</p>
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <div className="rounded-2xl border border-border p-6">
          <h2 className="text-lg font-semibold text-foreground">{t('jobTitle')}</h2>
          <p className="mt-2 text-sm text-foreground/70">
            {match} {callback}
          </p>
          <Link href="/get-a-quote" className="mt-4 inline-block text-sm font-semibold text-brand hover:underline">
            {t('jobCta')}
          </Link>
        </div>
        <div className="rounded-2xl border border-border p-6">
          <h2 className="text-lg font-semibold text-foreground">{t('contractorTitle')}</h2>
          <p className="mt-2 text-sm text-foreground/70">{t('contractorBody', { callback: applicant })}</p>
          <Link href="/apply" className="mt-4 inline-block text-sm font-semibold text-brand hover:underline">
            {t('contractorCta')}
          </Link>
        </div>
      </div>
    </div>
  );
}
