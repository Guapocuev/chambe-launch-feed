/**
 * Real completed jobs only. Photos live in website/public/gallery/{id}/.
 *
 * Pins are lot-accurate lat/lng geocoded at edit time. This module is
 * imported by client components and ships to the browser — never put a
 * street number or full street address in fields OR comments (Next keeps
 * comments in client chunks and source maps). Public copy is neighbourhood
 * only. Homepage carousels every job; /gallery shows the list plus the map.
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
    lat: 43.629698,
    lng: -79.506185,
    coverImage: '/gallery/etobicoke-deck/digging-footings.png',
    photos: [
      '/gallery/etobicoke-deck/digging-footings.png',
      '/gallery/etobicoke-deck/crew.png',
      '/gallery/etobicoke-deck/layout-stakes-and-tape.jpg',
      '/gallery/etobicoke-deck/layout-with-crew.jpg',
      '/gallery/etobicoke-deck/landscape-fabric-layout.jpg',
      '/gallery/etobicoke-deck/ledger-drilling-basement.jpg',
      '/gallery/etobicoke-deck/post-wrap-woodfiller.jpg',
      '/gallery/etobicoke-deck/fascia-prep-crew.jpg',
      '/gallery/etobicoke-deck/primed-fascia-and-wraps.jpg',
      '/gallery/etobicoke-deck/measuring-deck-board.jpg',
      '/gallery/etobicoke-deck/finished-deck-from-yard.jpg',
      '/gallery/etobicoke-deck/finished-stairs-and-glass-rail.jpg',
      '/gallery/etobicoke-deck/stairs-to-sliding-door.jpg',
      '/gallery/etobicoke-deck/finished-deck-seating.jpg',
      '/gallery/etobicoke-deck/finished-deck-and-stone-patio.jpg',
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
    lat: 43.66526,
    lng: -79.44293,
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
    id: 'black-forest-lane-barrie',
    title: 'Exterior roofline trim',
    trade: 'carpentry',
    location: 'Barrie',
    mapLabel: 'Barrie',
    description:
      'Installed white wood trim boards under the second-floor roofline and overhang.',
    lat: 44.401443,
    lng: -79.607127,
    coverImage: '/gallery/black-forest-lane-barrie/finished-roofline-trim.jpg',
    photos: [
      '/gallery/black-forest-lane-barrie/finished-roofline-trim.jpg',
      '/gallery/black-forest-lane-barrie/sanding-trim-boards.jpg',
      '/gallery/black-forest-lane-barrie/overhang-in-progress.jpg',
      '/gallery/black-forest-lane-barrie/trim-install-with-ladders.jpg',
      '/gallery/black-forest-lane-barrie/soffit-boards-install.jpg',
      '/gallery/black-forest-lane-barrie/finished-soffit-from-patio.jpg',
      '/gallery/black-forest-lane-barrie/finished-overhang-soffit.jpg',
      '/gallery/black-forest-lane-barrie/fascia-and-soffit-detail.jpg',
      '/gallery/black-forest-lane-barrie/overhang-trim-and-glass-rail.jpg',
      '/gallery/black-forest-lane-barrie/patio-screens.png',
      '/gallery/black-forest-lane-barrie/house-rear.png',
      '/gallery/black-forest-lane-barrie/patio-lake.png',
      '/gallery/black-forest-lane-barrie/house-pool.png',
      '/gallery/black-forest-lane-barrie/screen-box-install.png',
      '/gallery/black-forest-lane-barrie/fabricating-boxes.png',
      '/gallery/black-forest-lane-barrie/crew.png',
    ],
  },
  {
    id: 'lippincott-toronto',
    title: 'Full-house framing and envelope',
    trade: 'carpentry',
    location: 'Toronto',
    description:
      'Demolished the existing house, then framed the new build from the roof down — walls, stairs, all of it. Insulation, sheathing, and Blueskin air and vapour barrier.',
    lat: 43.66415,
    lng: -79.40942,
    coverImage: '/gallery/lippincott-toronto/exterior-finished.png',
    photos: [
      '/gallery/lippincott-toronto/exterior-finished.png',
      '/gallery/lippincott-toronto/blueskin-strapping.png',
      '/gallery/lippincott-toronto/interior-framing.png',
      '/gallery/lippincott-toronto/blueskin-roof.png',
      '/gallery/lippincott-toronto/roof-framing-crew.png',
      '/gallery/lippincott-toronto/blueskin-install.png',
      '/gallery/lippincott-toronto/full-height-wood-framing.jpg',
      '/gallery/lippincott-toronto/upper-framing-and-shoring.jpg',
      '/gallery/lippincott-toronto/rear-addition-framing.jpg',
      '/gallery/lippincott-toronto/engineered-floor-joists.jpg',
      '/gallery/lippincott-toronto/subfloor-over-joists.jpg',
      '/gallery/lippincott-toronto/subfloor-and-foundation.jpg',
    ],
  },
  {
    id: 'kenilworth-ceiling-light',
    title: 'Ceiling fan to pot light',
    trade: 'electrical',
    location: 'East End, Toronto',
    mapLabel: 'East End',
    description:
      'Demoed the old ceiling fan, cleared it out, installed a new pot light, and tested that it was working.',
    lat: 43.673252,
    lng: -79.303286,
    coverImage: '/gallery/kenilworth-ceiling-light/light-on.jpg',
    photos: [
      '/gallery/kenilworth-ceiling-light/light-on.jpg',
      '/gallery/kenilworth-ceiling-light/light-off.jpg',
      '/gallery/kenilworth-ceiling-light/fan-removal.jpg',
    ],
  },
  {
    id: 'kenilworth-east-end',
    title: 'Basement bathroom and storage',
    trade: 'carpentry',
    location: 'East End, Toronto',
    mapLabel: 'East End',
    description:
      'Added storage space and a bathroom, plus a gas-dryer setup. We demoed small sections of concrete wall for more storage space, ran new electrical for the bathroom light, switch, and fan, installed HVAC ductwork to vent the gas dryer, then framed, drywalled, and taped the new walls ready for a cabinet installer.',
    lat: 43.673684,
    lng: -79.303489,
    coverImage: '/gallery/kenilworth-east-end/bathroom-framing-and-rough-in.jpg',
    photos: [
      '/gallery/kenilworth-east-end/bathroom-framing-and-rough-in.jpg',
      '/gallery/kenilworth-east-end/concrete-wall-drilling.jpg',
      '/gallery/kenilworth-east-end/drywall-taping.png',
      '/gallery/kenilworth-east-end/framing-insulation.png',
      '/gallery/kenilworth-east-end/electrical-panel.png',
      '/gallery/kenilworth-east-end/bathroom-opening.png',
      '/gallery/kenilworth-east-end/foundation-demo.png',
      '/gallery/kenilworth-east-end/plumbing-rough-in.png',
      '/gallery/kenilworth-east-end/ceiling-circuits.png',
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
    lat: 43.630519,
    lng: -79.522998,
    coverImage: '/gallery/titan-road-etobicoke/drywall-in-progress.jpg',
    photos: [
      '/gallery/titan-road-etobicoke/drywall-in-progress.jpg',
      '/gallery/titan-road-etobicoke/metal-stud-framing.jpg',
      '/gallery/titan-road-etobicoke/lift-at-wall.jpg',
      '/gallery/titan-road-etobicoke/full-height-stud-framing.jpg',
      '/gallery/titan-road-etobicoke/framing-from-office-platform.jpg',
      '/gallery/titan-road-etobicoke/framing-doorway-opening.jpg',
      '/gallery/titan-road-etobicoke/metal-studs-at-column.jpg',
      '/gallery/titan-road-etobicoke/drywall-window-opening.jpg',
      '/gallery/titan-road-etobicoke/drywall-and-upper-framing.jpg',
      '/gallery/titan-road-etobicoke/high-drywall-at-column.jpg',
      '/gallery/titan-road-etobicoke/finished-wall-with-window.jpg',
    ],
  },
];
