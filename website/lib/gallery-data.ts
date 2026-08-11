/**
 * Before/after project gallery data.
 *
 * No real project photos exist yet, so this ships empty rather than with
 * placeholder/fake projects pretending to be real ones — GalleryGrid
 * renders a designed empty state instead (see components/GalleryGrid.tsx).
 *
 * To add a real project once photos exist, push an entry here — nothing
 * else needs to change, GalleryGrid picks it up automatically. Both image
 * fields are optional: leave them out and the grid shows a neutral
 * placeholder panel instead of a broken image.
 */
export interface GalleryProject {
  id: string;
  title: string;
  trade: 'electrical' | 'plumbing' | 'carpentry';
  location: string;
  description: string;
  beforeImage?: string;
  afterImage?: string;
}

export const galleryProjects: GalleryProject[] = [];
