import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { GalleryCarousel } from '@/components/GalleryCarousel';
import { MapTeaser } from '@/components/MapTeaser';
import { galleryProjects } from '@/lib/gallery-data';
import { formatCad } from '@/lib/format-cad';
import { pageMetadata } from '@/lib/metadata';
import {
  BUSINESS_HOURS_LABEL,
  CALLBACK_MINUTES,
  CONTRACTOR_ACCEPT_MINUTES,
} from '@/lib/response-time';

export async function generateMetadata() {
  const t = await getTranslations('Home');
  return pageMetadata(`${t('heroTitle')} ${t('heroAccent')}`, t('heroBody'), '/');
}

export default async function Home() {
  const locale = await getLocale();
  const t = await getTranslations('Home');
  const tGallery = await getTranslations('Gallery');
  const tTime = await getTranslations('ResponseTime');
  const teaserProjects = galleryProjects.map((project) => ({
    ...project,
    title: tGallery(`projects.${project.id}.title`),
    description: tGallery(`projects.${project.id}.description`),
  }));
  const match = tTime('matchWindow', { minutes: CONTRACTOR_ACCEPT_MINUTES });
  const callback = tTime('callbackWindow', {
    hours: tTime('businessHours'),
    minutes: CALLBACK_MINUTES,
  });

  const trust = [
    { title: t('trust1Title'), detail: t('trust1Detail') },
    { title: t('trust2Title'), detail: t('trust2Detail') },
    { title: t('trust3Title'), detail: t('trust3Detail') },
  ];

  const steps = [
    { number: '1', title: t('step1Title'), description: t('step1Body') },
    { number: '2', title: t('step2Title'), description: t('step2Body') },
    { number: '3', title: t('step3Title'), description: t('step3Body', { match, callback }) },
  ];

  return (
    <>
      <section className="border-b border-border bg-surface">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 py-20 md:grid-cols-2 md:items-center md:py-28">
          <div>
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl">
              {t('heroTitle')}{' '}
              <span className="text-brand">{t('heroAccent')}</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-foreground/70">{t('heroBody')}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/get-a-quote"
                className="rounded-full bg-accent px-7 py-3.5 text-center text-sm font-semibold text-inverse transition hover:bg-accent-dark"
              >
                {t('getEstimate')}
              </Link>
              <Link
                href="/visualize"
                className="rounded-full border border-border px-7 py-3.5 text-center text-sm font-semibold text-foreground transition hover:border-brand hover:text-brand"
              >
                {t('previewKitchen')}
              </Link>
            </div>
          </div>
          <div className="hidden justify-self-end rounded-3xl bg-brand/10 p-10 md:block">
            <div className="rounded-2xl bg-background p-6 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-wide text-accent">
                {t('instantEstimate')}
              </div>
              <div className="mt-2 text-2xl font-bold text-foreground">
                {`${formatCad(270, locale)} – ${formatCad(325, locale)}`}
              </div>
              <div className="mt-1 text-sm text-foreground/60">{t('sampleJob')}</div>
              <div className="mt-4 rounded-lg bg-surface px-3 py-2 text-xs text-foreground/60">
                {t('sampleMatch')}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 md:grid-cols-3 md:gap-0 md:divide-x md:divide-border">
          {trust.map((signal) => (
            <div key={signal.title} className="md:px-8 first:md:pl-0 last:md:pr-0">
              <div className="h-1 w-8 rounded-full bg-accent" aria-hidden="true" />
              <p className="mt-4 text-lg font-semibold text-foreground">{signal.title}</p>
              <p className="mt-2 text-sm text-foreground/70">{signal.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">{t('howTitle')}</h2>
          <p className="mx-auto mt-3 max-w-xl text-foreground/70">{t('howIntro')}</p>
        </div>
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {steps.map((step) => (
            <div key={step.number} className="rounded-2xl border border-border p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-inverse text-sm font-bold text-inverse-foreground">
                {step.number}
              </div>
              <h3 className="mt-4 text-lg font-semibold text-foreground">{step.title}</h3>
              <p className="mt-2 text-sm text-foreground/70">{step.description}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Link href="/how-it-works" className="text-sm font-semibold text-brand hover:underline">
            {t('moreHow')}
          </Link>
        </div>
      </section>

      <section className="border-y border-border bg-surface">
        <div className="mx-auto max-w-3xl px-6 py-20 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">{t('missionTitle')}</h2>
          <p className="mt-4 text-foreground/70">{t('missionBody')}</p>
          <Link href="/about" className="mt-6 inline-block text-sm font-semibold text-brand hover:underline">
            {t('moreMission')}
          </Link>
        </div>
      </section>

      {teaserProjects.length > 0 && (
        <section className="overflow-hidden border-b border-border">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-foreground">{t('galleryTeaserTitle')}</h2>
                <p className="mt-2 text-foreground/70">{t('galleryTeaserBody')}</p>
              </div>
              <Link href="/gallery" className="hidden shrink-0 text-sm font-semibold text-brand hover:underline sm:block">
                {t('viewGallery')}
              </Link>
            </div>
            <div className="mt-10">
              <GalleryCarousel projects={teaserProjects} />
            </div>
            <Link href="/gallery" className="mt-6 block text-sm font-semibold text-brand hover:underline sm:hidden">
              {t('viewGallery')}
            </Link>
          </div>
        </section>
      )}

      <MapTeaser />

      <section className="bg-inverse">
        <div className="mx-auto max-w-3xl px-6 py-16 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-inverse-foreground">{t('readyTitle')}</h2>
          <p className="mt-3 text-inverse-foreground/80">
            {t('readyDetail', {
              acceptMinutes: CONTRACTOR_ACCEPT_MINUTES,
              hours: BUSINESS_HOURS_LABEL,
              callbackMinutes: CALLBACK_MINUTES,
            })}
          </p>
          <Link
            href="/get-a-quote"
            className="mt-6 inline-block rounded-full bg-accent px-7 py-3.5 text-sm font-semibold text-inverse transition hover:bg-accent-dark"
          >
            {t('getEstimate')}
          </Link>
        </div>
      </section>
    </>
  );
}
