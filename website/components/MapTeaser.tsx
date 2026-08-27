'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { galleryProjects } from '@/lib/gallery-data';

const ProjectMap = dynamic(
  () => import('@/components/ProjectMap').then((m) => m.ProjectMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[280px] items-center justify-center rounded-2xl border border-border bg-surface text-sm text-foreground/50">
        Loading map…
      </div>
    ),
  },
);

export function MapTeaser() {
  return (
    <section className="border-y border-border bg-surface">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              Work happening across Toronto
            </h2>
            <p className="mt-4 text-foreground/70">
              Homeowners see proof in their neighbourhood. Contractors see where Chambé is active.
              Every completed job lands on the map.
            </p>
            <Link
              href="/gallery"
              className="mt-6 inline-block rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-inverse transition hover:bg-accent-dark"
            >
              Explore past work
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
