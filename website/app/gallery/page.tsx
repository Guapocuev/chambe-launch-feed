import type { Metadata } from 'next';
import Link from 'next/link';
import { PastWorkExplorer } from '@/components/PastWorkExplorer';
import { galleryProjects } from '@/lib/gallery-data';

export const metadata: Metadata = {
  title: 'Gallery',
  description: 'Photos from completed Chambé jobs, with a map of where the work was done.',
};

export default function GalleryPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-20">
      <h1 className="text-4xl font-bold tracking-tight text-foreground">Real jobs, real results</h1>
      <p className="mt-4 max-w-2xl text-lg text-foreground/70">
        Completed work from Chambé contractors. Tap a pin to see the job.
      </p>
      <div className="mt-12">
        <PastWorkExplorer projects={galleryProjects} />
      </div>
      <div className="mt-16 rounded-2xl border border-border bg-surface p-8 text-center">
        <h2 className="text-2xl font-bold text-foreground">Ready to get it fixed?</h2>
        <p className="mt-2 text-foreground/70">Get a free estimate — no account required.</p>
        <Link
          href="/get-a-quote"
          className="mt-6 inline-block rounded-full bg-accent px-7 py-3.5 text-sm font-semibold text-inverse transition hover:bg-accent-dark"
        >
          Get a Free Estimate
        </Link>
      </div>
    </div>
  );
}
