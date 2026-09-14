'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import dynamic from 'next/dynamic';
import { galleryProjects } from '@/lib/gallery-data';

function MapLoading() {
  const t = useTranslations('Home');
  return (
    <div className="flex h-[280px] items-center justify-center rounded-2xl border border-border bg-surface text-sm text-foreground/50">
      {t('mapLoading')}
    </div>
  );
}

const ProjectMap = dynamic(
  () => import('@/components/ProjectMap').then((m) => m.ProjectMap),
  {
    ssr: false,
    loading: () => <MapLoading />,
  },
);

export function MapTeaser() {
  const t = useTranslations('Home');
  return (
    <section className="border-y border-border bg-surface">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              {t('mapTitle')}
            </h2>
            <p className="mt-4 text-foreground/70">{t('mapBody')}</p>
            <Link
              href="/gallery"
              className="mt-6 inline-block rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-inverse transition hover:bg-accent-dark"
            >
              {t('mapCta')}
            </Link>
          </div>
          <ProjectMap
            projects={galleryProjects}
            className="shadow-sm"
            heightClassName="h-[320px] w-full sm:h-[360px]"
            scrollWheelZoom={false}
          />
        </div>
      </div>
    </section>
  );
}
