import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { pageMetadata } from '@/lib/metadata';
import { CALLBACK_MINUTES, CONTRACTOR_ACCEPT_MINUTES } from '@/lib/response-time';

export async function generateMetadata() {
  const t = await getTranslations('HowItWorks');
  return pageMetadata(t('title'), t('intro'), '/how-it-works');
}

export default async function HowItWorksPage() {
  const t = await getTranslations('HowItWorks');
  const tCta = await getTranslations('Nav');
  const tTime = await getTranslations('ResponseTime');
  const match = tTime('matchWindow', { minutes: CONTRACTOR_ACCEPT_MINUTES });
  const callback = tTime('callbackWindow', {
    hours: tTime('businessHours'),
    minutes: CALLBACK_MINUTES,
  });

  const steps = [
    { number: '1', title: t('step1Title'), description: t('step1Body') },
    { number: '2', title: t('step2Title'), description: t('step2Body') },
    { number: '3', title: t('step3Title'), description: t('step3Body', { match, callback }) },
  ];

  return (
    <div className="mx-auto max-w-4xl px-6 py-20">
      <h1 className="text-4xl font-bold tracking-tight text-foreground">{t('title')}</h1>
      <p className="mt-4 max-w-2xl text-lg text-foreground/70">{t('intro')}</p>

      <div className="mt-14 space-y-10">
        {steps.map((step) => (
          <div key={step.number} className="flex gap-6">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-inverse text-lg font-bold text-inverse-foreground">
              {step.number}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">{step.title}</h2>
              <p className="mt-2 text-foreground/70">{step.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-16 rounded-2xl border border-border bg-surface p-8 text-center">
        <h2 className="text-2xl font-bold text-foreground">{t('ctaTitle')}</h2>
        <p className="mt-2 text-foreground/70">{t('ctaBody')}</p>
        <Link
          href="/get-a-quote"
          className="mt-6 inline-block rounded-full bg-accent px-7 py-3.5 text-sm font-semibold text-inverse transition hover:bg-accent-dark"
        >
          {tCta('getEstimate')}
        </Link>
      </div>
    </div>
  );
}
