'use client';

import { useEffect, useRef, useState } from 'react';
import type { Map as LeafletMap, Marker } from 'leaflet';
import type { GalleryProject } from '@/lib/gallery-data';
import { SERVICE_AREA_BOUNDS, TORONTO_CENTER } from '@/lib/gallery-data';

interface ProjectMapProps {
  projects: GalleryProject[];
  /** Highlight a project when selected from the gallery list */
  activeProjectId?: string | null;
  onProjectSelect?: (id: string) => void;
  className?: string;
}

export function ProjectMap({
  projects,
  activeProjectId,
  onProjectSelect,
  className = '',
}: ProjectMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      if (!containerRef.current || mapRef.current) return;

      const L = (await import('leaflet')).default;

      if (cancelled || !containerRef.current) return;

      const map = L.map(containerRef.current, {
        center: [TORONTO_CENTER.lat, TORONTO_CENTER.lng],
        zoom: 11,
        scrollWheelZoom: false,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map);

      L.rectangle(SERVICE_AREA_BOUNDS, {
        color: '#111111',
        weight: 1.5,
        fillColor: '#f2c94c',
        fillOpacity: 0.08,
        dashArray: '6 4',
      }).addTo(map);

      mapRef.current = map;
      setReady(true);
    }

    init();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!ready || !mapRef.current) return;

    let cancelled = false;

    async function updateMarkers() {
      const L = (await import('leaflet')).default;
      if (cancelled || !mapRef.current) return;

      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      const icon = L.divIcon({
        className: '',
        html: `<div style="
          width:14px;height:14px;
          background:#f2c94c;
          border:2px solid #111;
          border-radius:50%;
          box-shadow:0 1px 4px rgba(0,0,0,.25);
        "></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });

      projects.forEach((project) => {
        const marker = L.marker([project.lat, project.lng], { icon }).addTo(mapRef.current!);
        marker.bindPopup(
          `<strong>${project.title}</strong><br/>
           <span style="color:#666">${project.neighborhood} · ${project.trade}</span>`,
        );
        marker.on('click', () => onProjectSelect?.(project.id));
        markersRef.current.push(marker);
      });

      if (projects.length > 0) {
        const group = L.featureGroup(markersRef.current);
        mapRef.current.fitBounds(group.getBounds().pad(0.2));
      }
    }

    updateMarkers();
    return () => {
      cancelled = true;
    };
  }, [ready, projects, onProjectSelect]);

  useEffect(() => {
    if (!ready || !activeProjectId || !mapRef.current) return;

    const project = projects.find((p) => p.id === activeProjectId);
    if (project) {
      mapRef.current.setView([project.lat, project.lng], 14, { animate: true });
    }
  }, [activeProjectId, projects, ready]);

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-border ${className}`}>
      <div ref={containerRef} className="h-[420px] w-full bg-surface sm:h-[480px]" />

      {projects.length === 0 && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/95 via-background/70 to-transparent px-6 pb-6 pt-16">
          <p className="text-sm font-medium text-foreground">
            Completed jobs will appear as pins across Toronto
          </p>
          <p className="mt-1 text-xs text-foreground/60">
            Homeowners browse results by neighbourhood · contractors see where Chambé is active
          </p>
        </div>
      )}
    </div>
  );
}
