/**
 * Real completed jobs only. Photos live in website/public/gallery/{id}/.
 *
 * Map pins are neighbourhood-accurate and offset from the lot — close
 * enough to show where we work, not enough to identify a house. Never
 * put a street number on the public card. Homepage carousels every job;
 * /gallery shows the full list plus the map.
 */
export type GalleryTrade = 'electrical' | 'plumbing' | 'carpentry';

export interface GalleryProject {
  id: string;
  title: string;
  trade: GalleryTrade;
  location: string;
  /** Short neighbourhood chip label. Jobs that share this filter together. */
  mapLabel?: string;
  description: string;
  lat: number;
  lng: number;
  coverImage: string;
  photos: string[];
  beforeImage?: string;
  afterImage?: string;
}

export const TRADE_LABELS: Record<GalleryTrade, string> = {
  electrical: 'Electrical',
  plumbing: 'Plumbing',
  carpentry: 'Carpentry',
};

export const TORONTO_CENTER = { lat: 43.6532, lng: -79.3832 } as const;

/** Neighbourhood chip — jobs that share a mapLabel/location filter together. */
export function neighbourhoodLabel(project: GalleryProject): string {
  return project.mapLabel ?? project.location;
}

export function uniqueNeighbourhoods(projects: GalleryProject[]): string[] {
  return [...new Set(projects.map(neighbourhoodLabel))];
}

export const galleryProjects: GalleryProject[] = [
  {
    id: 'etobicoke-deck',
    title: 'New backyard deck',
    trade: 'carpentry',
    location: 'Etobicoke',
    mapLabel: 'Etobicoke',
    description:
      'The backyard was just grass. We laid out and dug the footings, poured the concrete, built the whole deck, then sanded and stained the wood.',
    // Near Edgecroft Rd / Humber Valley, offset ~400m from the lot.
    lat: 43.6648,
    lng: -79.5165,
    coverImage: '/gallery/etobicoke-deck/digging-footings.png',
    photos: [
      '/gallery/etobicoke-deck/digging-footings.png',
      '/gallery/etobicoke-deck/crew.png',
    ],
  },
  {
    id: 'downtown-kitchen',
    title: 'Kitchen renovation',
    trade: 'carpentry',
    location: 'Downtown, Toronto',
    mapLabel: 'Downtown',
    description:
      'Top-to-bottom kitchen renovation: demoed the old kitchen, new drywall and taping, two new circuits from the breaker for the microwave, oven, fridge, and dishwasher we installed, new plumbing, a tiled backsplash, and the main floor painted white with new window and door trim, baseboards, and a yellow front door. A Blink video doorbell was also installed.',
    // Lappin / Wallace Emerson, offset ~400m from the lot.
    lat: 43.668,
    lng: -79.4372,
    coverImage: '/gallery/downtown-kitchen/kitchen-finished.png',
    photos: [
      '/gallery/downtown-kitchen/kitchen-finished.png',
      '/gallery/downtown-kitchen/kitchen-before.png',
      '/gallery/downtown-kitchen/kitchen-before-galley.png',
      '/gallery/downtown-kitchen/rough-in.png',
      '/gallery/downtown-kitchen/electrical-rough-in.png',
      '/gallery/downtown-kitchen/electrical-panel.png',
      '/gallery/downtown-kitchen/drywall.png',
      '/gallery/downtown-kitchen/taping.png',
      '/gallery/downtown-kitchen/cabinets.png',
      '/gallery/downtown-kitchen/backsplash.png',
      '/gallery/downtown-kitchen/painting-trim.png',
      '/gallery/downtown-kitchen/kitchen-appliances.png',
      '/gallery/downtown-kitchen/video-doorbell.png',
    ],
  },
  {
    id: 'rosas-house-barrie',
    title: 'Patio screens and trim',
    trade: 'carpentry',
    location: 'Barrie',
    description:
      'Finish carpentry at a lakeside home: custom boxes to conceal patio phantom screens, trim finishing, and moving furnishings in and out so the space could be used again.',
    // East Kempenfelt Bay waterfront outskirts, offset ~400m from the lot.
    lat: 44.375,
    lng: -79.641,
    coverImage: '/gallery/rosas-house-barrie/patio-screens.png',
    photos: [
      '/gallery/rosas-house-barrie/patio-screens.png',
      '/gallery/rosas-house-barrie/house-rear.png',
      '/gallery/rosas-house-barrie/patio-lake.png',
      '/gallery/rosas-house-barrie/house-pool.png',
      '/gallery/rosas-house-barrie/screen-box-install.png',
      '/gallery/rosas-house-barrie/fabricating-boxes.png',
      '/gallery/rosas-house-barrie/crew.png',
    ],
  },
  {
    id: 'lippincott-toronto',
    title: 'Full-house framing and envelope',
    trade: 'carpentry',
    location: 'Toronto',
    description:
      'Demolished the existing house, then framed the new build from the roof down — walls, stairs, all of it. Insulation, sheathing, and Blueskin air and vapour barrier.',
    // Harbord Village / west Annex, offset ~400m from the Lippincott lot.
    lat: 43.6624,
    lng: -79.4031,
    coverImage: '/gallery/lippincott-toronto/exterior-finished.png',
    photos: [
      '/gallery/lippincott-toronto/exterior-finished.png',
      '/gallery/lippincott-toronto/blueskin-strapping.png',
      '/gallery/lippincott-toronto/interior-framing.png',
      '/gallery/lippincott-toronto/blueskin-roof.png',
      '/gallery/lippincott-toronto/roof-framing-crew.png',
      '/gallery/lippincott-toronto/blueskin-install.png',
    ],
  },
  {
    id: 'east-end-addition',
    title: 'Bathroom and storage addition',
    trade: 'carpentry',
    location: 'East End, Toronto',
    mapLabel: 'East End',
    description:
      'Opened up a tight storage space for a room and bathroom addition. Demo where it was needed, framed the walls around the electrical panel and the new bath, drywall and taping, a new circuit for the fan, light, and outlet, and a gas-dryer vent cut with metal HVAC run outside.',
    // Woodbine / East Danforth, offset ~400m from the lot.
    lat: 43.6856,
    lng: -79.3062,
    coverImage: '/gallery/east-end-addition/drywall-taping.png',
    photos: [
      '/gallery/east-end-addition/drywall-taping.png',
      '/gallery/east-end-addition/framing-insulation.png',
      '/gallery/east-end-addition/electrical-panel.png',
      '/gallery/east-end-addition/bathroom-opening.png',
      '/gallery/east-end-addition/foundation-demo.png',
      '/gallery/east-end-addition/plumbing-rough-in.png',
      '/gallery/east-end-addition/ceiling-circuits.png',
    ],
  },
  {
    id: 'east-end-ceiling-light',
    title: 'Ceiling fan to light',
    trade: 'electrical',
    location: 'East End, Toronto',
    mapLabel: 'East End',
    description:
      'Swapped an old ceiling fan for a new flush-mount light — disconnected the fan, wired the fixture, and left a clean finish on the ceiling.',
    // Same East End street as the addition, offset so both pins read as
    // neighbours at neighbourhood zoom without overlapping into one dot.
    lat: 43.6852,
    lng: -79.302,
    coverImage: '/gallery/east-end-ceiling-light/light-on.png',
    photos: [
      '/gallery/east-end-ceiling-light/light-on.png',
      '/gallery/east-end-ceiling-light/light-off.png',
      '/gallery/east-end-ceiling-light/fan-removal.png',
    ],
  },
  {
    id: 'titan-road-etobicoke',
    title: 'Warehouse partition wall',
    trade: 'carpentry',
    location: 'Etobicoke',
    mapLabel: 'Etobicoke',
    description:
      'Inside a commercial warehouse we framed a full-height industrial partition with metal studs, including a window opening, then insulated, drywalled, taped, and painted the entire wall. A large-scale commercial build — not a house job.',
    // South Etobicoke industrial (Titan Rd / The Queensway), offset ~400m from the lot.
    lat: 43.6332,
    lng: -79.5191,
    coverImage: '/gallery/titan-road-etobicoke/drywall-in-progress.jpg',
    photos: [
      '/gallery/titan-road-etobicoke/drywall-in-progress.jpg',
      '/gallery/titan-road-etobicoke/metal-stud-framing.jpg',
      '/gallery/titan-road-etobicoke/lift-at-wall.jpg',
    ],
  },
];
