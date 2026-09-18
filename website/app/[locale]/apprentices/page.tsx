import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { pageMetadata } from '@/lib/metadata';

export async function generateMetadata() {
  const t = await getTranslations('Apprentices');
  const tAuth = await getTranslations('Auth');
  return pageMetadata(t('title'), tAuth('apprenticeHoursNote'), '/apprentices');
}

export default async function ApprenticesPage() {
  const t = await getTranslations('Apprentices');
  const tAuth = await getTranslations('Auth');

  return (
    <div className="mx-auto max-w-2xl px-6 py-20">
      <h1 className="text-4xl font-bold tracking-tight text-foreground">{t('title')}</h1>
      <p className="mt-4 text-lg text-foreground/70">{t('intro')}</p>
      <p className="mt-4 text-lg leading-relaxed text-foreground/70">{tAuth('apprenticeHoursNote')}</p>
      <div className="mt-8">
        <Link
          href="/apprentice/login"
          className="inline-block rounded-full bg-accent px-7 py-3.5 text-sm font-semibold text-inverse transition hover:bg-accent-dark"
        >
          {t('cta')}
        </Link>
      </div>
      <p className="mt-8 text-sm text-foreground/50">
        {t('already')}{' '}
        <Link href="/apprentice/login" className="font-medium text-foreground underline-offset-2 hover:underline">
          {t('login')}
        </Link>
      </p>
    </div>
  );
}
