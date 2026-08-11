'use client';

import { useState } from 'react';
import { GalleryGrid } from '@/components/GalleryGrid';
import { ProjectMap } from '@/components/ProjectMap';
import type { GalleryProject } from '@/lib/gallery-data';

interface PastWorkExplorerProps {
  projects: GalleryProject[];
}

export function PastWorkExplorer({ projects }: PastWorkExplorerProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  return (
    <>
      <ProjectMap
        projects={projects}
        activeProjectId={activeId}
        onProjectSelect={setActiveId}
        className="mt-10"
      />

      <div className="mt-14">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Project gallery</h2>
            <p className="mt-1 text-sm text-foreground/70">
              Before-and-after photos from completed Chambé jobs.
            </p>
          </div>
          {projects.length > 0 && (
            <p className="text-xs text-foreground/50">
              Click a pin on the map to jump to a project
            </p>
          )}
        </div>
        <div className="mt-8">
          <GalleryGrid
            projects={projects}
            activeProjectId={activeId}
            onProjectSelect={setActiveId}
          />
        </div>
      </div>
    </>
  );
}
