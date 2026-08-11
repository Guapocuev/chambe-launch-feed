import Link from 'next/link';
import type { GalleryProject } from '@/lib/gallery-data';

function ImagePane({ label, src }: { label: string; src?: string }) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={label} className="h-full w-full object-cover" />;
  }
  return (
    <div className="flex h-full w-full items-center justify-center bg-surface text-xs font-medium uppercase tracking-wide text-foreground/40">
      {label}
    </div>
  );
}

function ProjectCard({ project }: { project: GalleryProject }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-background">
      <div className="grid grid-cols-2 gap-px bg-border">
        <div className="aspect-square">
          <ImagePane label="Before" src={project.beforeImage} />
        </div>
        <div className="aspect-square">
          <ImagePane label="After" src={project.afterImage} />
        </div>
      </div>
      <div className="p-5">
        <div className="text-xs font-semibold uppercase tracking-wide text-accent">{project.trade}</div>
        <h3 className="mt-1 text-lg font-semibold text-foreground">{project.title}</h3>
        <p className="mt-1 text-sm text-foreground/60">{project.location}</p>
        <p className="mt-3 text-sm text-foreground/80">{project.description}</p>
      </div>
    </div>
  );
}

/**
 * Renders the before/after gallery from lib/gallery-data.ts's array. That
 * file ships empty (no real project photos exist yet) — this shows a
 * designed empty state instead of fake placeholder projects.
 */
export function GalleryGrid({ projects }: { projects: GalleryProject[] }) {
  if (projects.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-surface px-8 py-16 text-center">
        <h3 className="text-lg font-semibold text-foreground">Our first projects are in progress</h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-foreground/70">
          We&apos;re just getting started — real before/after photos from Chambé jobs will show up here
          as our contractors complete their first projects. Check back soon.
        </p>
        <Link
          href="/get-a-quote"
          className="mt-6 inline-block rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-dark"
        >
          Be one of our first projects
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}
