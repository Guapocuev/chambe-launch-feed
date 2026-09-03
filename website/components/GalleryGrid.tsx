'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { GalleryProject } from '@/lib/gallery-data';
import { TRADE_LABELS } from '@/lib/gallery-data';

export function ProjectCard({
  project,
  priority,
  className = '',
}: {
  project: GalleryProject;
  priority?: boolean;
  className?: string;
}) {
  const shots = project.photos.length > 0 ? project.photos : [project.coverImage];
  const [active, setActive] = useState(0);
  const current = shots[active] ?? project.coverImage;
  const hasBeforeAfter = Boolean(project.beforeImage && project.afterImage);

  return (
    <article
      id={`job-${project.id}`}
      className={`scroll-mt-24 overflow-hidden rounded-2xl border border-border bg-background ${className}`}
    >
      {hasBeforeAfter ? (
        <div className="grid grid-cols-2 gap-px bg-border">
          <div className="relative aspect-square">
            <Image
              src={project.beforeImage!}
              alt={`${project.title} — before, ${project.location}`}
              fill
              priority={priority}
              quality={90}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 40vw, 420px"
              className="object-contain bg-surface"
            />
            <span className="absolute left-2 top-2 rounded bg-background/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-foreground">
              Before
            </span>
          </div>
          <div className="relative aspect-square">
            <Image
              src={project.afterImage!}
              alt={`${project.title} — after, ${project.location}`}
              fill
              priority={priority}
              quality={90}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 40vw, 420px"
              className="object-contain bg-surface"
            />
            <span className="absolute left-2 top-2 rounded bg-background/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-foreground">
              After
            </span>
          </div>
        </div>
      ) : (
        <div>
          <div className="relative aspect-[3/2] bg-[color-mix(in_srgb,var(--foreground)_10%,var(--background))]">
            <Image
              key={current}
              src={current}
              alt={`${project.title}, ${project.location}`}
              fill
              priority={priority}
              quality={90}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 640px"
              className="object-contain"
            />
          </div>
          {shots.length > 1 && (
            <div className="flex gap-1 overflow-x-auto bg-surface p-2">
              {shots.map((src, index) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => setActive(index)}
                  aria-label={`Photo ${index + 1} of ${shots.length}`}
                  aria-pressed={index === active}
                  className={`relative h-14 w-16 shrink-0 overflow-hidden rounded border ${
                    index === active ? 'border-accent' : 'border-border'
                  }`}
                >
                  <Image src={src} alt="" fill quality={90} className="object-cover" sizes="96px" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      <div className="p-5">
        <div className="text-xs font-semibold uppercase tracking-wide text-accent">
          {TRADE_LABELS[project.trade]}
        </div>
        <h3 className="mt-1 text-lg font-semibold text-foreground">{project.title}</h3>
        <p className="mt-1 text-sm text-foreground/60">{project.location}</p>
        <p className="mt-3 text-sm text-foreground/80">{project.description}</p>
      </div>
    </article>
  );
}

export function GalleryGrid({ projects }: { projects: GalleryProject[] }) {
  if (projects.length === 0) return null;

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project, index) => (
        <ProjectCard key={project.id} project={project} priority={index === 0} />
      ))}
    </div>
  );
}
