import type { Metadata } from 'next';
import Link from 'next/link';
import { PastWorkExplorer } from '@/components/PastWorkExplorer';
import { galleryProjects } from '@/lib/gallery-data';
import { pageMetadata } from '@/lib/metadata';

export const metadata: Metadata = pageMetadata(
  'Past Work',
  'Browse completed Chambé projects across Toronto — before-and-after photos and a neighbourhood map for homeowners and contractors.',
  '/gallery',
);

export default function GalleryPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-20">
      <h1 className="text-4xl font-bold tracking-tight text-foreground">Past work across the city</h1>
      <p className="mt-4 max-w-2xl text-lg text-foreground/70">
        See where Chambé contractors have completed jobs — and what the results look like.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-accent">For homeowners</h2>
          <p className="mt-2 text-sm text-foreground/70">
            Browse real results in your neighbourhood before you request an estimate. Every pin is a
            vetted contractor job completed through Chambé.
          </p>
          <Link href="/get-a-quote" className="mt-3 inline-block text-sm font-semibold text-brand hover:underline">
            Get a free estimate →
          </Link>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-accent">For contractors</h2>
          <p className="mt-2 text-sm text-foreground/70">
            See where demand is landing across Toronto. As we grow, this map shows the neighbourhoods
            where Chambé is sending qualified leads.
          </p>
          <Link href="/apply" className="mt-3 inline-block text-sm font-semibold text-brand hover:underline">
            Apply to join the network →
          </Link>
        </div>
      </div>

      <PastWorkExplorer projects={galleryProjects} />
    </div>
  );
}
