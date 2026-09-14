import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { pageMetadata } from '@/lib/metadata';

export async function generateMetadata() {
  const t = await getTranslations('About');
  return pageMetadata(t('title'), t('p1'), '/about');
}

export default async function AboutPage() {
  const t = await getTranslations('About');
  const tTime = await getTranslations('ResponseTime');
  const callback = tTime('applicantWindow', { callback: tTime('applicantCallback') });

  return (
    <div className="mx-auto max-w-3xl px-6 py-20">
      <h1 className="text-4xl font-bold tracking-tight text-foreground">{t('title')}</h1>
      <p className="mt-6 text-lg leading-relaxed text-foreground/80">{t('p1')}</p>
      <p className="mt-6 text-lg leading-relaxed text-foreground/80">{t('p2')}</p>
      <p className="mt-6 text-lg leading-relaxed text-foreground/80">{t('p3')}</p>

      <div className="mt-14 grid gap-6 sm:grid-cols-2">
        <div className="rounded-2xl border border-border p-6">
          <h2 className="text-lg font-semibold text-foreground">{t('homeownersTitle')}</h2>
          <p className="mt-2 text-sm text-foreground/70">{t('homeownersBody')}</p>
          <Link href="/get-a-quote" className="mt-4 inline-block text-sm font-semibold text-brand hover:underline">
            {t('homeownersCta')}
          </Link>
        </div>
        <div className="rounded-2xl border border-border p-6">
          <h2 className="text-lg font-semibold text-foreground">{t('contractorsTitle')}</h2>
          <p className="mt-2 text-sm text-foreground/70">{t('contractorsBody', { callback })}</p>
          <Link href="/apply" className="mt-4 inline-block text-sm font-semibold text-brand hover:underline">
            {t('contractorsCta')}
          </Link>
        </div>
      </div>
    </div>
  );
}
