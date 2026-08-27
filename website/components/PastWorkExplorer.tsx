'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import type { GalleryProject } from '@/lib/gallery-data';
import { TRADE_LABELS, neighbourhoodLabel, uniqueNeighbourhoods } from '@/lib/gallery-data';
import { GalleryGrid } from '@/components/GalleryGrid';

const ProjectMap = dynamic(
  () => import('@/components/ProjectMap').then((m) => m.ProjectMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[380px] items-center justify-center rounded-2xl border border-border bg-surface text-sm text-foreground/50">
        Loading map…
      </div>
    ),
  },
);

export function PastWorkExplorer({ projects }: { projects: GalleryProject[] }) {
  const neighbourhoods = useMemo(() => uniqueNeighbourhoods(projects), [projects]);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(projects[0]?.id ?? null);
  const [zoomNonce, setZoomNonce] = useState(0);
  const [fitNonce, setFitNonce] = useState(0);

  const visible = selectedLocation
    ? projects.filter((project) => neighbourhoodLabel(project) === selectedLocation)
    : projects;

  const active =
    visible.find((project) => project.id === activeId) ?? visible[0] ?? projects[0];

  function selectLocation(label: string | null) {
    setSelectedLocation(label);
    if (!label) {
      setFitNonce((n) => n + 1);
      return;
    }
    const first = projects.find((project) => neighbourhoodLabel(project) === label);
    if (first) {
      setActiveId(first.id);
      setZoomNonce((n) => n + 1);
    }
  }

  function selectProject(id: string) {
    const job = projects.find((project) => project.id === id);
    if (!job) return;
    setActiveId(id);
    setSelectedLocation(neighbourhoodLabel(job));
    setZoomNonce((n) => n + 1);
  }

  function zoomToNeighbourhood() {
    if (!active) return;
    setActiveId(active.id);
    setZoomNonce((n) => n + 1);
  }

  function seePhotos(id: string) {
    setActiveId(id);
    document.getElementById(`job-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  if (projects.length === 0) return null;

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-stretch">
        <ProjectMap
          projects={projects}
          activeProjectId={active?.id}
          zoomNonce={zoomNonce}
          fitNonce={fitNonce}
          onProjectSelect={selectProject}
          heightClassName="h-[420px] w-full lg:h-full lg:min-h-[460px]"
        />

        {active && (
          <div className="flex flex-col justify-center rounded-2xl border border-border p-6">
            <div className="mb-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => selectLocation(null)}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  selectedLocation === null
                    ? 'bg-inverse text-inverse-foreground'
                    : 'bg-surface text-foreground/70 hover:bg-border'
                }`}
              >
                All
              </button>
              {neighbourhoods.map((label) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => selectLocation(label)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    selectedLocation === label
                      ? 'bg-inverse text-inverse-foreground'
                      : 'bg-surface text-foreground/70 hover:bg-border'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="text-xs font-semibold uppercase tracking-wide text-accent-dark">
              {TRADE_LABELS[active.trade]}
            </div>
            <h2 className="mt-1 text-xl font-semibold text-foreground">{active.title}</h2>
            <p className="mt-1 text-sm text-foreground/60">{active.location}</p>
            <p className="mt-3 text-sm text-foreground/80">{active.description}</p>
            <p className="mt-3 text-xs text-foreground/45">
              Pins show the neighbourhood, not the street address.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={zoomToNeighbourhood}
                className="text-sm font-semibold text-brand hover:underline"
              >
                Zoom to neighbourhood
              </button>
              <button
                type="button"
                onClick={() => seePhotos(active.id)}
                className="text-sm font-semibold text-brand hover:underline"
              >
                See photos →
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-12">
        {visible.length === 0 ? (
          <p className="text-sm text-foreground/60">No jobs in this neighbourhood yet.</p>
        ) : (
          <GalleryGrid projects={visible} />
        )}
      </div>
    </>
  );
}
