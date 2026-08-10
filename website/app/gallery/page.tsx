import type { Metadata } from 'next';
import { GalleryGrid } from '@/components/GalleryGrid';
import { galleryProjects } from '@/lib/gallery-data';

export const metadata: Metadata = {
  title: 'Gallery',
  description: 'Before-and-after photos from real Chambé projects.',
};

export default function GalleryPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-20">
      <h1 className="text-4xl font-bold tracking-tight text-foreground">Real jobs, real results</h1>
      <p className="mt-4 max-w-2xl text-lg text-foreground/70">
        A look at completed work from contractors on the Chambé platform.
      </p>
      <div className="mt-12">
        <GalleryGrid projects={galleryProjects} />
      </div>
    </div>
  );
}
