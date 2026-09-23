import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { PastWorkExplorer } from '@/components/PastWorkExplorer';
import { galleryProjects } from '@/lib/gallery-data';
import { MARKETING_CTA } from '@/lib/marketing-cta';
import { pageMetadata } from '@/lib/metadata';

export async function generateMetadata() {
  const t = await getTranslations('Gallery');
  return pageMetadata(t('title'), t('body'), '/gallery');
}

export default async function GalleryPage() {
  const t = await getTranslations('Gallery');
  const projects = galleryProjects.map((project) => ({
    ...project,
    title: t(`projects.${project.id}.title`),
    description: t(`projects.${project.id}.description`),
  }));

  return (
    <div className="mx-auto max-w-6xl px-6 py-20">
      <h1 className="text-4xl font-bold tracking-tight text-foreground">{t('title')}</h1>
      <p className="mt-4 max-w-2xl text-lg text-foreground/70">{t('body')}</p>
      <div className="mt-12">
        <PastWorkExplorer projects={projects} />
      </div>
      <div className="mt-16 rounded-2xl border border-border bg-surface p-8 text-center">
        <h2 className="text-2xl font-bold text-foreground">{t('ctaTitle')}</h2>
        <p className="mt-2 text-foreground/70">{t('ctaBody')}</p>
        <Link href="/get-a-quote" className={`mt-6 inline-block ${MARKETING_CTA}`}>
          {t('ctaButton')}
        </Link>
      </div>
    </div>
  );
}
