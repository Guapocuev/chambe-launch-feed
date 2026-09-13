import type { Metadata } from 'next';
import { Suspense } from 'react';
import { pageMetadata } from '@/lib/metadata';
import { VisualizeApp } from './VisualizeApp';

export const metadata: Metadata = pageMetadata(
  'Preview a kitchen renovation',
  'Upload one kitchen photo, pay a small preview fee, and see an illustrative modern-light renovation of the same room.',
  '/visualize',
);

export const dynamic = 'force-dynamic';
export const maxDuration = 80;

export default function VisualizePage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-sm font-semibold uppercase tracking-wide text-foreground/50">Kitchen only — Phase 1</p>
      <h1 className="mt-2 text-4xl font-bold tracking-tight text-foreground">See a renovation of your kitchen</h1>
      <p className="mt-4 text-lg text-foreground/70">
        Upload one photo. After a one-time $19 preview charge we generate a modern light finish on
        the same room. This is an illustrative AI preview, not a promise of the exact finished look.
      </p>
      <div className="mt-10">
        <Suspense fallback={<p className="text-sm text-foreground/70">Opening your preview…</p>}>
          <VisualizeApp />
        </Suspense>
      </div>
    </div>
  );
}
