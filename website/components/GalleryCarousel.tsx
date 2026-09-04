'use client';

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import type { GalleryProject } from '@/lib/gallery-data';
import { TRADE_LABELS } from '@/lib/gallery-data';
import { ProjectCard } from '@/components/GalleryGrid';

/** Shortest signed distance on a ring of `count` slots. */
function ringDelta(index: number, active: number, count: number) {
  if (count <= 1) return 0;
  let delta = index - active;
  while (delta > count / 2) delta -= count;
  while (delta < -count / 2) delta += count;
  return delta;
}

/**
 * Coverflow spacing around a vertical axis. Few jobs → wider X gap and
 * more Y-rotation; more jobs → compress so the fan stays in the stage.
 */
function fanMetrics(count: number, stageWidth: number, cardWidth: number) {
  if (count <= 1) return { deg: 0, x: 0, z: 0 };
  const maxOnSide = Math.max(1, Math.ceil((count - 1) / 2));
  const sideRoom = Math.max(28, (stageWidth - cardWidth) / 2);
  const x = Math.min(96, Math.max(28, sideRoom / maxOnSide));
  const deg = Math.min(38, Math.max(14, 78 / (count - 1)));
  const z = Math.min(90, Math.max(28, 200 / count));
  return { deg, x, z };
}

function projectShots(project: GalleryProject) {
  return project.photos.length > 0 ? project.photos : [project.coverImage];
}

type DragAxis = 'x' | 'y';
type DragMode = 'fan' | 'photo';

type DragState = {
  pointerId: number;
  startX: number;
  startY: number;
  moved: boolean;
  axis: DragAxis | null;
  mode: DragMode | null;
  projectId: string | null;
  photoCount: number;
  photoStart: number;
};

const AXIS_LOCK_PX = 2;
const FAN_UNIT_PX = 34;
const FAN_COMMIT_PX = 12;
const PHOTO_COMMIT_PX = 12;
const SNAP_MS = '420ms cubic-bezier(0.22, 0.61, 0.36, 1)';

function cardTransform(offset: number, metrics: { deg: number; x: number; z: number }) {
  const abs = Math.abs(offset);
  const isFront = abs < 0.45;
  const rotateY = -offset * metrics.deg;
  const x = offset * metrics.x;
  const z = isFront ? 48 : -abs * metrics.z;
  const scale = isFront ? 1 : Math.max(0.88, 1 - abs * 0.04);
  return {
    isFront,
    zIndex: Math.round(80 - abs * 10),
    opacity: isFront ? '1' : '0.92',
    transform: `translate3d(-50%, -50%, 0) translate3d(${x}px, 0, ${z}px) rotateY(${rotateY}deg) scale(${scale})`,
  };
}

export function GalleryCarousel({ projects }: { projects: GalleryProject[] }) {
  const count = projects.length;
  const labelId = useId();
  const stageRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef(0);
  const dragRef = useRef<DragState | null>(null);
  const didDragRef = useRef(false);
  const photoByIdRef = useRef<Record<string, number>>({});
  const modalOpenRef = useRef(false);
  const metricsRef = useRef({ deg: 0, x: 0, z: 0 });
  const dragOffsetRef = useRef(0);
  const paintRafRef = useRef(0);
  const [active, setActive] = useState(0);
  const [stageWidth, setStageWidth] = useState(720);
  const [photoById, setPhotoById] = useState<Record<string, number>>({});
  const [modalProject, setModalProject] = useState<GalleryProject | null>(null);
  const [mounted, setMounted] = useState(false);

  activeRef.current = active;
  photoByIdRef.current = photoById;
  modalOpenRef.current = Boolean(modalProject);

  const paintFan = useCallback(
    (activeIndex: number, drag: number, instant: boolean) => {
      const stage = stageRef.current;
      if (!stage || count < 1) return;
      const metrics = metricsRef.current;
      projects.forEach((project, index) => {
        const node = stage.querySelector<HTMLElement>(`[data-rolodex-card="${CSS.escape(project.id)}"]`);
        if (!node) return;
        const painted = cardTransform(ringDelta(index, activeIndex + drag, count), metrics);
        node.style.transform = painted.transform;
        node.style.zIndex = String(painted.zIndex);
        node.style.opacity = painted.opacity;
        node.style.transition = instant ? 'none' : `transform ${SNAP_MS}, opacity ${SNAP_MS}`;
        node.setAttribute('aria-hidden', painted.isFront ? 'false' : 'true');
      });
    },
    [count, projects],
  );

  const paintFanLive = useCallback(
    (drag: number) => {
      dragOffsetRef.current = drag;
      paintFan(activeRef.current, drag, true);
    },
    [paintFan],
  );

  const go = useCallback(
    (next: number) => {
      if (count === 0) return;
      if (paintRafRef.current) {
        cancelAnimationFrame(paintRafRef.current);
        paintRafRef.current = 0;
      }
      const wrapped = ((next % count) + count) % count;
      activeRef.current = wrapped;
      dragOffsetRef.current = 0;
      setActive(wrapped);
      const stage = stageRef.current;
      if (stage) stage.style.cursor = '';
      paintFan(wrapped, 0, false);
    },
    [count, paintFan],
  );

  const step = useCallback(
    (direction: -1 | 1) => {
      go(activeRef.current + direction);
    },
    [go],
  );

  const setPhoto = useCallback((projectId: string, index: number) => {
    setPhotoById((prev) => ({ ...prev, [projectId]: index }));
  }, []);

  const stepPhoto = useCallback((projectId: string, photoCount: number, direction: -1 | 1) => {
    if (photoCount < 2) return;
    setPhotoById((prev) => {
      const current = prev[projectId] ?? 0;
      return { ...prev, [projectId]: ((current + direction) % photoCount + photoCount) % photoCount };
    });
  }, []);

  const openModal = useCallback((project: GalleryProject) => {
    if (didDragRef.current) return;
    setModalProject(project);
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const measure = () => setStageWidth(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useLayoutEffect(() => {
    paintFan(active, 0, false);
  }, [active, paintFan, stageWidth, count]);

  useEffect(() => {
    const el = stageRef.current;
    if (!el || count < 1) return;

    const release = (pointerId: number) => {
      if (el.hasPointerCapture(pointerId)) {
        try {
          el.releasePointerCapture(pointerId);
        } catch {
          /* already released */
        }
      }
    };

    const resetDrag = () => {
      dragRef.current = null;
      dragOffsetRef.current = 0;
      el.style.cursor = '';
      paintFan(activeRef.current, 0, false);
    };

    const onDown = (event: PointerEvent) => {
      didDragRef.current = false;
      if (modalOpenRef.current) return;
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest('a, [data-photo-thumb], [data-photo-thumbs]')) return;
      const card = target?.closest('[data-rolodex-card]');
      const projectId = card?.getAttribute('data-rolodex-card') ?? null;
      const project = projectId ? projects.find((item) => item.id === projectId) : null;
      const frontId = projects[activeRef.current]?.id;
      const onFrontPhoto = Boolean(
        projectId &&
          projectId === frontId &&
          target?.closest('[data-photo-zone]'),
      );
      const shots = project ? projectShots(project).length : 0;
      dragRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        moved: false,
        axis: null,
        mode: onFrontPhoto && shots > 1 ? 'photo' : 'fan',
        projectId: onFrontPhoto ? projectId : null,
        photoCount: shots,
        photoStart: projectId ? photoByIdRef.current[projectId] ?? 0 : 0,
      };
    };

    const onMove = (event: PointerEvent) => {
      const dragState = dragRef.current;
      if (!dragState || event.pointerId !== dragState.pointerId) return;
      const deltaX = event.clientX - dragState.startX;
      const deltaY = event.clientY - dragState.startY;

      if (!dragState.axis) {
        if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) < AXIS_LOCK_PX) return;
        if (Math.abs(deltaY) > Math.abs(deltaX)) {
          dragState.axis = 'y';
          dragRef.current = null;
          return;
        }
        dragState.axis = 'x';
        dragState.moved = true;
        didDragRef.current = true;
        try {
          el.setPointerCapture(event.pointerId);
        } catch {
          /* move/up still fire on the stage while the pointer stays inside */
        }
        if (dragState.mode === 'fan') el.style.cursor = 'grabbing';
      }

      if (dragState.axis !== 'x') return;
      event.preventDefault();
      if (dragState.mode === 'fan') {
        paintFanLive(Math.max(-1.2, Math.min(1.2, -deltaX / FAN_UNIT_PX)));
      }
    };

    const finish = (event: PointerEvent) => {
      const dragState = dragRef.current;
      if (!dragState || event.pointerId !== dragState.pointerId) return;
      const deltaX = event.clientX - dragState.startX;
      release(event.pointerId);
      dragRef.current = null;

      if (dragState.axis !== 'x') {
        resetDrag();
        return;
      }

      if (dragState.mode === 'photo' && dragState.projectId) {
        if (deltaX <= -PHOTO_COMMIT_PX) {
          stepPhoto(dragState.projectId, dragState.photoCount, 1);
        } else if (deltaX >= PHOTO_COMMIT_PX) {
          stepPhoto(dragState.projectId, dragState.photoCount, -1);
        }
        el.style.cursor = '';
        return;
      }

      if (deltaX <= -FAN_COMMIT_PX) go(activeRef.current + 1);
      else if (deltaX >= FAN_COMMIT_PX) go(activeRef.current - 1);
      else resetDrag();
    };

    const onCancel = (event: PointerEvent) => {
      const dragState = dragRef.current;
      if (!dragState || event.pointerId !== dragState.pointerId) return;
      release(event.pointerId);
      resetDrag();
    };

    const suppressClickAfterDrag = (event: Event) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('[data-photo-thumb], [data-photo-thumbs]')) {
        didDragRef.current = false;
        return;
      }
      if (!didDragRef.current) return;
      event.preventDefault();
      event.stopPropagation();
      didDragRef.current = false;
    };

    const wheel = { accum: 0, axis: null as 'x' | 'y' | null, timer: 0 };
    const clearWheelTimer = () => {
      if (wheel.timer) window.clearTimeout(wheel.timer);
      wheel.timer = 0;
    };
    const settleWheel = () => {
      wheel.timer = 0;
      wheel.axis = null;
      const accum = wheel.accum;
      wheel.accum = 0;
      if (Math.abs(accum) < FAN_COMMIT_PX) {
        resetDrag();
        return;
      }
      const steps = accum > 0 ? 1 : -1;
      go(activeRef.current + steps);
    };

    const onWheel = (event: WheelEvent) => {
      if (modalOpenRef.current) return;
      if (event.ctrlKey) return;

      const dx = event.deltaX;
      const dy = event.deltaY;
      if (dx === 0 && dy === 0) return;

      const onThumbs = (event.target as HTMLElement | null)?.closest('[data-photo-thumbs]');
      if (onThumbs && Math.abs(dx) >= Math.abs(dy)) return;

      if (!wheel.axis) {
        if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return;
        wheel.axis = Math.abs(dx) * 1.2 >= Math.abs(dy) ? 'x' : 'y';
      }

      if (wheel.axis === 'y') {
        clearWheelTimer();
        wheel.timer = window.setTimeout(() => {
          wheel.axis = null;
          wheel.timer = 0;
        }, 140);
        const before = window.scrollY;
        requestAnimationFrame(() => {
          if (window.scrollY === before) {
            window.scrollBy({ top: dy, left: 0, behavior: 'instant' });
          }
        });
        return;
      }

      event.preventDefault();
      wheel.accum += dx;
      el.style.cursor = 'grabbing';
      paintFanLive(Math.max(-1.2, Math.min(1.2, wheel.accum / FAN_UNIT_PX)));
      clearWheelTimer();
      wheel.timer = window.setTimeout(settleWheel, 70);
    };

    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointermove', onMove, { passive: false });
    el.addEventListener('pointerup', finish);
    el.addEventListener('pointercancel', onCancel);
    el.addEventListener('click', suppressClickAfterDrag, true);
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      clearWheelTimer();
      if (paintRafRef.current) cancelAnimationFrame(paintRafRef.current);
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', finish);
      el.removeEventListener('pointercancel', onCancel);
      el.removeEventListener('click', suppressClickAfterDrag, true);
      el.removeEventListener('wheel', onWheel);
    };
  }, [count, go, paintFan, paintFanLive, projects, stepPhoto]);

  if (count === 0) return null;

  const cardWidth = Math.min(340, Math.max(252, stageWidth * 0.46));
  const metrics = fanMetrics(count, stageWidth, cardWidth);
  metricsRef.current = metrics;
  const current = projects[active];

  return (
    <>
      <div className="overflow-clip md:grid md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center md:gap-3">
        <button
          type="button"
          aria-label="Previous jobs"
          disabled={count < 2}
          onClick={() => step(-1)}
          className="relative z-20 mb-3 hidden h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-background text-foreground shadow-sm transition hover:border-brand disabled:cursor-not-allowed disabled:opacity-25 disabled:hover:border-border md:mb-0 md:flex"
        >
          <Chevron dir="left" />
        </button>

        <div
          ref={stageRef}
          role="region"
          aria-roledescription="rolodex"
          aria-labelledby={labelId}
          tabIndex={0}
          onKeyDown={(event) => {
            if (modalProject) return;
            if (event.key === 'ArrowLeft') {
              event.preventDefault();
              step(-1);
            } else if (event.key === 'ArrowRight') {
              event.preventDefault();
              step(1);
            }
          }}
          className="relative z-0 h-[32rem] w-full min-w-0 cursor-grab select-none overflow-clip [perspective:1100px] [perspective-origin:50%_50%] outline-none focus-visible:ring-2 focus-visible:ring-accent sm:h-[34rem]"
          style={{ touchAction: 'pan-y' }}
        >
          <p id={labelId} className="sr-only">
            Completed jobs. {current ? `${current.title}, ${current.location}.` : ''} Swipe or use arrow keys to
            browse. Tap a card for the full job.
          </p>

          <div className="absolute inset-0 [transform-style:preserve-3d]">
            {projects.map((project, index) => {
              const painted = cardTransform(ringDelta(index, active, count), metrics);
              const shots = projectShots(project);

              return (
                <div
                  key={project.id}
                  data-rolodex-card={project.id}
                  aria-hidden={!painted.isFront}
                  className="absolute left-1/2 top-1/2 max-h-[calc(100%-1.5rem)] cursor-pointer will-change-transform [backface-visibility:hidden]"
                  style={{
                    width: cardWidth,
                    zIndex: painted.zIndex,
                    transform: painted.transform,
                    transformOrigin: '50% 50%',
                    opacity: painted.opacity,
                    transition: `transform ${SNAP_MS}, opacity ${SNAP_MS}`,
                  }}
                  onClick={(event) => {
                    if (didDragRef.current) return;
                    if ((event.target as HTMLElement).closest('[data-photo-thumb], [data-photo-thumbs]')) return;
                    openModal(project);
                  }}
                >
                  <div className="max-h-[calc(32rem-1.5rem)] overflow-clip rounded-2xl shadow-[0_14px_32px_rgba(0,0,0,0.18)] sm:max-h-[calc(34rem-1.5rem)]">
                    <ProjectCard
                      project={project}
                      priority
                      photoZone
                      keepShotsMounted
                      photoIndex={((photoById[project.id] ?? 0) % shots.length + shots.length) % shots.length}
                      onPhotoIndexChange={(next) => setPhoto(project.id, next)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          aria-label="Next jobs"
          disabled={count < 2}
          onClick={() => step(1)}
          className="relative z-20 mt-3 hidden h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-background text-foreground shadow-sm transition hover:border-brand disabled:cursor-not-allowed disabled:opacity-25 disabled:hover:border-border md:mt-0 md:flex"
        >
          <Chevron dir="right" />
        </button>
      </div>

      {mounted && modalProject
        ? createPortal(
            <JobModal
              project={modalProject}
              photoIndex={photoById[modalProject.id] ?? 0}
              onPhotoIndexChange={(index) => setPhoto(modalProject.id, index)}
              onClose={() => setModalProject(null)}
            />,
            document.body,
          )
        : null}
    </>
  );
}

function JobModal({
  project,
  photoIndex,
  onPhotoIndexChange,
  onClose,
}: {
  project: GalleryProject;
  photoIndex: number;
  onPhotoIndexChange: (index: number) => void;
  onClose: () => void;
}) {
  const shots = projectShots(project);
  const index = ((photoIndex % shots.length) + shots.length) % shots.length;
  const current = shots[index] ?? project.coverImage;
  const closeRef = useRef<HTMLButtonElement>(null);
  const dragRef = useRef<{ startX: number } | null>(null);
  const indexRef = useRef(index);
  indexRef.current = index;

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (shots.length < 2) return;
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        const currentIndex = indexRef.current;
        onPhotoIndexChange(((currentIndex - 1) % shots.length + shots.length) % shots.length);
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        const currentIndex = indexRef.current;
        onPhotoIndexChange(((currentIndex + 1) % shots.length + shots.length) % shots.length);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose, onPhotoIndexChange, shots.length]);

  const goPhoto = (direction: -1 | 1) => {
    if (shots.length < 2) return;
    onPhotoIndexChange(((index + direction) % shots.length + shots.length) % shots.length);
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-stretch justify-center bg-inverse/80 p-0 sm:items-center sm:p-6"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={`job-modal-${project.id}`}
        className="relative flex h-full w-full max-w-3xl flex-col overflow-y-auto bg-background shadow-2xl sm:h-auto sm:max-h-[92vh] sm:rounded-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          ref={closeRef}
          type="button"
          aria-label="Close job details"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background/95 text-foreground shadow-sm transition hover:border-brand"
        >
          <CloseIcon />
        </button>

        <div
          className="relative aspect-[4/3] w-full shrink-0 bg-[color-mix(in_srgb,var(--foreground)_10%,var(--background))] sm:aspect-[16/10]"
          onPointerDown={(event) => {
            if (event.pointerType === 'mouse' && event.button !== 0) return;
            dragRef.current = { startX: event.clientX };
          }}
          onPointerUp={(event) => {
            const start = dragRef.current;
            dragRef.current = null;
            if (!start || shots.length < 2) return;
            const deltaX = event.clientX - start.startX;
            if (deltaX <= -PHOTO_COMMIT_PX) goPhoto(1);
            else if (deltaX >= PHOTO_COMMIT_PX) goPhoto(-1);
          }}
        >
          <Image
            key={current}
            src={current}
            alt={`${project.title}, ${project.location}`}
            fill
            priority
            quality={90}
            sizes="(max-width: 768px) 100vw, 768px"
            className="object-contain"
          />
          {shots.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Previous photo"
                onClick={() => goPhoto(-1)}
                className="absolute left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background/90 text-foreground shadow-sm"
              >
                <Chevron dir="left" />
              </button>
              <button
                type="button"
                aria-label="Next photo"
                onClick={() => goPhoto(1)}
                className="absolute right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background/90 text-foreground shadow-sm"
              >
                <Chevron dir="right" />
              </button>
              <p className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-background/90 px-3 py-1 text-xs font-medium text-foreground">
                {index + 1} / {shots.length}
              </p>
            </>
          )}
        </div>

        {shots.length > 1 && (
          <div className="flex gap-1 overflow-x-auto bg-surface px-4 py-2">
            {shots.map((src, shotIndex) => (
              <button
                key={src}
                type="button"
                aria-label={`Photo ${shotIndex + 1} of ${shots.length}`}
                aria-pressed={shotIndex === index}
                onClick={() => onPhotoIndexChange(shotIndex)}
                className={`relative h-14 w-16 shrink-0 overflow-hidden rounded border ${
                  shotIndex === index ? 'border-accent' : 'border-border'
                }`}
              >
                <Image src={src} alt="" fill quality={90} className="object-cover" sizes="96px" />
              </button>
            ))}
          </div>
        )}

        <div className="px-5 py-5 pb-10 sm:pb-6">
          <div className="text-xs font-semibold uppercase tracking-wide text-accent">
            {TRADE_LABELS[project.trade]}
          </div>
          <h2 id={`job-modal-${project.id}`} className="mt-1 text-2xl font-bold text-foreground">
            {project.title}
          </h2>
          <p className="mt-1 text-sm text-foreground/60">{project.location}</p>
          <p className="mt-4 text-base leading-relaxed text-foreground/85">{project.description}</p>
        </div>
      </div>
    </div>
  );
}

function Chevron({ dir }: { dir: 'left' | 'right' }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      {dir === 'left' ? (
        <path
          d="M11.25 4.5 6.75 9l4.5 4.5"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <path
          d="M6.75 4.5 11.25 9l-4.5 4.5"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path
        d="M5 5l8 8M13 5l-8 8"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}
