export type VisualizeShowcaseExampleId = 'open' | 'galley' | 'condo';

export interface VisualizeShowcaseExample {
  id: VisualizeShowcaseExampleId;
  before: string;
  after: string;
}

/**
 * Curated marketing examples for the kitchen visualizer.
 * `open` and `galley` start from a real downtown kitchen photo in /gallery.
 * `condo` is an illustrative typical kitchen, not a client job.
 * After images are AI-generated modern-light previews — not live paid jobs.
 */

/** Free pre-pay inspiration. Reuses package presets + existing static after-images. */
export const curatedLooks: { slug: string; image: string }[] = [
  { slug: 'modern_light', image: '/visualize/after-open.jpg' },
];

export const visualizeShowcaseExamples: VisualizeShowcaseExample[] = [
  {
    id: 'open',
    before: '/gallery/downtown-kitchen/kitchen-before.png',
    after: '/visualize/after-open.jpg',
  },
  {
    id: 'galley',
    before: '/gallery/downtown-kitchen/kitchen-before-galley.png',
    after: '/visualize/after-galley.jpg',
  },
  {
    id: 'condo',
    before: '/visualize/before-condo.jpg',
    after: '/visualize/after-condo.jpg',
  },
];
