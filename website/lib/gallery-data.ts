/**
 * Before/after project gallery + map pin data.
 *
 * Ships empty — no fake projects. GalleryGrid and ProjectMap render
 * designed empty states until real entries are added here.
 *
 * To add a project, push an entry with lat/lng for the map pin
 * (neighbourhood centroid is fine until exact addresses exist).
 */
export interface GalleryProject {
  id: string;
  title: string;
  trade: 'electrical' | 'plumbing' | 'carpentry';
  /** Human-readable neighbourhood, e.g. "Leslieville" */
  location: string;
  neighborhood: string;
  /** WGS-84 coordinates for the map pin */
  lat: number;
  lng: number;
  completedAt?: string;
  description: string;
  beforeImage?: string;
  afterImage?: string;
}

/** Toronto centre — default map viewport */
export const TORONTO_CENTER = { lat: 43.6532, lng: -79.3832 } as const;

/** Service-area bounds (approx GTA core) for the map overlay */
export const SERVICE_AREA_BOUNDS: [[number, number], [number, number]] = [
  [43.58, -79.52],
  [43.78, -79.25],
];

export const galleryProjects: GalleryProject[] = [];
