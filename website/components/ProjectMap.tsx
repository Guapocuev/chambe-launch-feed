'use client';

import { useEffect, useRef, useState } from 'react';
import type { Map as LeafletMap, Marker, TileLayer } from 'leaflet';
import type { GalleryProject } from '@/lib/gallery-data';
import { TORONTO_CENTER, TRADE_LABELS } from '@/lib/gallery-data';

/** Neighbourhood streets — not close enough to pick out a house. */
const MAX_ZOOM = 15;
const MIN_ZOOM = 8;
const NEIGHBOURHOOD_ZOOM = 14;
const OVERVIEW_ZOOM = 11;

const FLY = { duration: 1.45, easeLinearity: 0.22 } as const;

type Basemap = 'streets' | 'city';

interface ProjectMapProps {
  projects: GalleryProject[];
  activeProjectId?: string | null;
  /** Increment to re-fly even when the same pin is already selected. */
  zoomNonce?: number;
  /** Increment to fit all pins (e.g. after choosing All). */
  fitNonce?: number;
  onProjectSelect?: (id: string) => void;
  className?: string;
  heightClassName?: string;
  scrollWheelZoom?: boolean;
  showBasemapToggle?: boolean;
}

export function ProjectMap({
  projects,
  activeProjectId,
  zoomNonce = 0,
  fitNonce = 0,
  onProjectSelect,
  className = '',
  heightClassName = 'h-[420px] w-full sm:h-[480px]',
  scrollWheelZoom = true,
  showBasemapToggle = true,
}: ProjectMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<Map<string, Marker>>(new Map());
  const streetsLayerRef = useRef<TileLayer | null>(null);
  const cityLayerRef = useRef<TileLayer | null>(null);
  const onSelectRef = useRef(onProjectSelect);
  // Keep the latest callback without re-initializing the map.
  // eslint-disable-next-line react-hooks/refs
  onSelectRef.current = onProjectSelect;
  const [ready, setReady] = useState(false);
  const [basemap, setBasemap] = useState<Basemap>('streets');

  useEffect(() => {
    let cancelled = false;
    let map: LeafletMap | undefined;
    let resizeObserver: ResizeObserver | undefined;

    async function init() {
      if (!containerRef.current) return;

      const leaflet = await import('leaflet');
      const L = leaflet.default ?? leaflet;
      if (cancelled || !containerRef.current) return;

      const el = containerRef.current;
      if ((el as HTMLDivElement & { _leaflet_id?: number })._leaflet_id) return;

      map = L.map(el, {
        center: [TORONTO_CENTER.lat, TORONTO_CENTER.lng],
        zoom: 11,
        minZoom: MIN_ZOOM,
        maxZoom: MAX_ZOOM,
        scrollWheelZoom,
        wheelPxPerZoomLevel: 42,
        zoomSnap: 0.25,
        zoomDelta: 0.5,
        zoomAnimation: true,
        fadeAnimation: true,
        markerZoomAnimation: true,
        // Default is 4 — jumping 8→14 skipped the animation and felt sporadic.
        zoomAnimationThreshold: 12,
        inertia: true,
        inertiaDeceleration: 2400,
        easeLinearity: 0.22,
        bounceAtZoomLimits: false,
        attributionControl: true,
        zoomControl: true,
      });

      const streets = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: MAX_ZOOM,
        minZoom: MIN_ZOOM,
        keepBuffer: 6,
        updateWhenIdle: false,
        updateWhenZooming: true,
      });

      const city = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          attribution:
            'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics',
          maxZoom: MAX_ZOOM,
          minZoom: MIN_ZOOM,
          keepBuffer: 6,
          updateWhenIdle: false,
          updateWhenZooming: true,
        },
      );

      streets.addTo(map);
      streetsLayerRef.current = streets;
      cityLayerRef.current = city;

      mapRef.current = map;
      setReady(true);

      const invalidate = () => map?.invalidateSize({ animate: false });
      requestAnimationFrame(invalidate);
      resizeObserver = new ResizeObserver(invalidate);
      resizeObserver.observe(el);
    }

    void init();

    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
      if (map) {
        map.remove();
        if (mapRef.current === map) mapRef.current = null;
      }
    };
  }, [scrollWheelZoom]);

  useEffect(() => {
    const map = mapRef.current;
    const streets = streetsLayerRef.current;
    const city = cityLayerRef.current;
    if (!ready || !map || !streets || !city) return;

    if (basemap === 'city') {
      if (map.hasLayer(streets)) map.removeLayer(streets);
      if (!map.hasLayer(city)) city.addTo(map);
    } else {
      if (map.hasLayer(city)) map.removeLayer(city);
      if (!map.hasLayer(streets)) streets.addTo(map);
    }
  }, [basemap, ready]);

  useEffect(() => {
    if (!ready || !mapRef.current) return;

    let cancelled = false;

    async function updateMarkers() {
      const leaflet = await import('leaflet');
      const L = leaflet.default ?? leaflet;
      if (cancelled || !mapRef.current) return;

      markersRef.current.forEach((m) => m.remove());
      markersRef.current.clear();

      projects.forEach((project) => {
        const marker = L.marker([project.lat, project.lng], {
          icon: pinIcon(L, project.id === activeProjectId),
          title: `${project.title}, ${project.location}`,
          riseOnHover: true,
        }).addTo(mapRef.current!);

        marker.bindPopup(
          `<strong>${escapeHtml(project.title)}</strong><br/>
           <span style="color:#555">${escapeHtml(project.location)} · ${TRADE_LABELS[project.trade]}</span>`,
        );
        marker.on('click', () => onSelectRef.current?.(project.id));
        markersRef.current.set(project.id, marker);
      });

      if (projects.length > 0) {
        const group = L.featureGroup([...markersRef.current.values()]);
        mapRef.current.flyToBounds(group.getBounds().pad(0.22), {
          maxZoom: OVERVIEW_ZOOM,
          duration: FLY.duration,
          easeLinearity: FLY.easeLinearity,
        });
      }
    }

    void updateMarkers();
    return () => {
      cancelled = true;
    };
    // Pins are restyled in a separate effect when the selection changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, projects]);

  useEffect(() => {
    if (!ready || !mapRef.current) return;
    void import('leaflet').then((leaflet) => {
      const L = leaflet.default ?? leaflet;
      markersRef.current.forEach((marker, id) => {
        marker.setIcon(pinIcon(L, id === activeProjectId));
        marker.setZIndexOffset(id === activeProjectId ? 1000 : 0);
      });
    });
  }, [activeProjectId, ready]);

  useEffect(() => {
    if (!ready || !mapRef.current || zoomNonce === 0) return;
    const project = projects.find((p) => p.id === activeProjectId);
    if (project) flyToJob(mapRef.current, project.lat, project.lng);
  }, [zoomNonce, activeProjectId, projects, ready]);

  useEffect(() => {
    if (!ready || !mapRef.current || fitNonce === 0) return;
    const markers = [...markersRef.current.values()];
    if (markers.length === 0) return;
    void import('leaflet').then((leaflet) => {
      const L = leaflet.default ?? leaflet;
      if (!mapRef.current) return;
      const group = L.featureGroup(markers);
      mapRef.current.flyToBounds(group.getBounds().pad(0.22), {
        maxZoom: OVERVIEW_ZOOM,
        duration: FLY.duration,
        easeLinearity: FLY.easeLinearity,
      });
    });
  }, [fitNonce, ready]);

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-border ${heightClassName} ${className}`}
    >
      <p className="pointer-events-none absolute left-4 top-4 z-[400] rounded bg-background/90 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-foreground/50">
        Where we&apos;ve worked
      </p>

      {showBasemapToggle && (
        <div className="absolute right-4 top-4 z-[400] flex overflow-hidden rounded-full border border-border bg-background/95 text-xs font-semibold shadow-sm">
          <button
            type="button"
            onClick={() => setBasemap('streets')}
            className={`px-3 py-1.5 transition ${
              basemap === 'streets' ? 'bg-inverse text-inverse-foreground' : 'text-foreground/70 hover:bg-surface'
            }`}
          >
            Streets
          </button>
          <button
            type="button"
            onClick={() => setBasemap('city')}
            className={`px-3 py-1.5 transition ${
              basemap === 'city' ? 'bg-inverse text-inverse-foreground' : 'text-foreground/70 hover:bg-surface'
            }`}
          >
            Satellite
          </button>
        </div>
      )}

      <div ref={containerRef} className="chambe-map h-full min-h-[inherit] w-full" />

      {projects.length === 0 && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/95 via-background/70 to-transparent px-6 pb-6 pt-16">
          <p className="text-sm font-medium text-foreground">
            Completed jobs appear as pins across the GTA
          </p>
          <p className="mt-1 text-xs text-foreground/60">
            Pins show the neighbourhood, not the street address.
          </p>
        </div>
      )}
    </div>
  );
}

function flyToJob(map: LeafletMap, lat: number, lng: number) {
  const currentZoom = map.getZoom();
  const alreadyClose =
    map.getBounds().pad(-0.15).contains([lat, lng]) && currentZoom >= NEIGHBOURHOOD_ZOOM - 0.6;

  if (alreadyClose) {
    map.panTo([lat, lng], { animate: true, duration: 0.85, easeLinearity: 0.25 });
    return;
  }

  map.flyTo([lat, lng], NEIGHBOURHOOD_ZOOM, {
    duration: FLY.duration,
    easeLinearity: FLY.easeLinearity,
  });
}

function pinIcon(
  L: { divIcon: (options: import('leaflet').DivIconOptions) => import('leaflet').DivIcon },
  selected: boolean,
) {
  const size = selected ? 22 : 18;
  const fill = selected ? '#111111' : '#f2c94c';
  return L.divIcon({
    className: 'chambe-map-pin',
    html: `<span class="chambe-map-pin-dot" style="
      width:${size}px;height:${size}px;
      background:${fill};
      border:2px solid #ffffff;
      box-shadow:0 1px 6px rgba(0,0,0,.35);
    "></span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
