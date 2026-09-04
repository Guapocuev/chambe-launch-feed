'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import Image from 'next/image';
import type { GalleryProject } from '@/lib/gallery-data';
import { TRADE_LABELS } from '@/lib/gallery-data';

const AXIS_LOCK_PX = 2;
const STRIP_COMMIT_PX = 12;
const SNAP_MS = '420ms cubic-bezier(0.22, 0.61, 0.36, 1)';

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function PhotoThumbStrip({ children, activeIndex }: { children: ReactNode; activeIndex: number }) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const maxRef = useRef(0);
  const didScrollRef = useRef(false);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    startOffset: number;
    moved: boolean;
    axis: 'x' | 'y' | null;
  } | null>(null);

  useEffect(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || !track) return;

    const paint = (offset: number, instant: boolean) => {
      const x = clamp(offset, 0, maxRef.current);
      offsetRef.current = x;
      track.style.transition = instant ? 'none' : `transform ${SNAP_MS}`;
      track.style.transform = `translate3d(${-x}px, 0, 0)`;
    };

    const measure = () => {
      maxRef.current = Math.max(0, track.scrollWidth - viewport.clientWidth);
      paint(offsetRef.current, true);
    };

    const stops = () =>
      [...track.querySelectorAll<HTMLElement>('[data-photo-thumb]')].map((thumb) => thumb.offsetLeft);

    const snapToNearest = (from: number) => {
      const candidates = stops();
      if (candidates.length === 0) {
        paint(from, false);
        return;
      }
      let best = clamp(from, 0, maxRef.current);
      let bestDist = Infinity;
      for (const stop of candidates) {
        const target = clamp(stop, 0, maxRef.current);
        const dist = Math.abs(target - from);
        if (dist < bestDist) {
          bestDist = dist;
          best = target;
        }
      }
      paint(best, false);
    };

    const onDown = (event: PointerEvent) => {
      event.stopPropagation();
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      didScrollRef.current = false;
      dragRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        startOffset: offsetRef.current,
        moved: false,
        axis: null,
      };
    };

    const onMove = (event: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;
      const deltaX = event.clientX - drag.startX;
      const deltaY = event.clientY - drag.startY;
      if (!drag.axis) {
        if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) < AXIS_LOCK_PX) return;
        if (Math.abs(deltaY) > Math.abs(deltaX)) {
          dragRef.current = null;
          return;
        }
        drag.axis = 'x';
        drag.moved = true;
        didScrollRef.current = true;
        try {
          viewport.setPointerCapture(event.pointerId);
        } catch {
          /* move still updates the track while the pointer stays inside */
        }
      }
      if (drag.axis !== 'x') return;
      event.preventDefault();
      event.stopPropagation();
      paint(drag.startOffset - deltaX, true);
    };

    const end = (event: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;
      const deltaX = event.clientX - drag.startX;
      dragRef.current = null;
      if (!drag.moved || Math.abs(deltaX) < STRIP_COMMIT_PX) {
        paint(drag.startOffset, false);
      } else {
        snapToNearest(offsetRef.current);
      }
      if (didScrollRef.current) {
        window.setTimeout(() => {
          didScrollRef.current = false;
        }, 0);
      }
    };

    const onClickCapture = (event: Event) => {
      if (!didScrollRef.current) return;
      event.preventDefault();
      event.stopPropagation();
      didScrollRef.current = false;
    };

    const wheel = { start: 0, accum: 0, timer: 0 };
    const clearWheel = () => {
      if (wheel.timer) window.clearTimeout(wheel.timer);
      wheel.timer = 0;
    };
    const onWheel = (event: WheelEvent) => {
      const dx =
        event.shiftKey && Math.abs(event.deltaY) > Math.abs(event.deltaX)
          ? event.deltaY
          : event.deltaX;
      if (Math.abs(dx) < Math.abs(event.deltaY) && !event.shiftKey) return;
      event.preventDefault();
      event.stopPropagation();
      if (!wheel.timer) wheel.start = offsetRef.current;
      wheel.accum += dx;
      paint(wheel.start + wheel.accum, true);
      clearWheel();
      wheel.timer = window.setTimeout(() => {
        const accum = wheel.accum;
        wheel.accum = 0;
        wheel.timer = 0;
        if (Math.abs(accum) < STRIP_COMMIT_PX) paint(wheel.start, false);
        else snapToNearest(offsetRef.current);
      }, 70);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(viewport);
    ro.observe(track);
    viewport.addEventListener('pointerdown', onDown);
    viewport.addEventListener('pointermove', onMove, { passive: false });
    viewport.addEventListener('pointerup', end);
    viewport.addEventListener('pointercancel', end);
    viewport.addEventListener('click', onClickCapture, true);
    viewport.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      clearWheel();
      ro.disconnect();
      viewport.removeEventListener('pointerdown', onDown);
      viewport.removeEventListener('pointermove', onMove);
      viewport.removeEventListener('pointerup', end);
      viewport.removeEventListener('pointercancel', end);
      viewport.removeEventListener('click', onClickCapture, true);
      viewport.removeEventListener('wheel', onWheel);
    };
  }, []);

  useEffect(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || !track) return;
    const thumb = track.querySelectorAll<HTMLElement>('[data-photo-thumb]')[activeIndex];
    if (!thumb) return;
    const view = viewport.clientWidth;
    const left = thumb.offsetLeft;
    const right = left + thumb.offsetWidth;
    const start = offsetRef.current;
    if (left < start) {
      track.style.transition = `transform ${SNAP_MS}`;
      const next = clamp(left, 0, maxRef.current);
      offsetRef.current = next;
      track.style.transform = `translate3d(${-next}px, 0, 0)`;
    } else if (right > start + view) {
      track.style.transition = `transform ${SNAP_MS}`;
      const next = clamp(right - view, 0, maxRef.current);
      offsetRef.current = next;
      track.style.transform = `translate3d(${-next}px, 0, 0)`;
    }
  }, [activeIndex]);

  return (
    <div
      ref={viewportRef}
      data-photo-thumbs=""
      className="min-w-0 max-w-full overflow-hidden bg-surface"
      style={{ touchAction: 'pan-y' }}
    >
      <div
        ref={trackRef}
        className="flex w-max gap-1 px-2 py-2 will-change-transform [backface-visibility:hidden]"
        style={{ transform: 'translate3d(0, 0, 0)' }}
      >
        {children}
      </div>
    </div>
  );
}

export function ProjectCard({
  project,
  priority,
  className = '',
  photoZone = false,
  photoIndex,
  onPhotoIndexChange,
  keepShotsMounted = false,
}: {
  project: GalleryProject;
  priority?: boolean;
  className?: string;
  /** Marks the main photo as a swipe zone (homepage rolodex). */
  photoZone?: boolean;
  photoIndex?: number;
  onPhotoIndexChange?: (index: number) => void;
  /** Keep every shot in the DOM so swapping photos does not remount images. */
  keepShotsMounted?: boolean;
}) {
  const shots = project.photos.length > 0 ? project.photos : [project.coverImage];
  const [internal, setInternal] = useState(0);
  const active = photoIndex ?? internal;
  const setActive = (index: number) => {
    if (onPhotoIndexChange) onPhotoIndexChange(index);
    else setInternal(index);
  };
  const current = shots[active] ?? project.coverImage;
  const hasBeforeAfter = Boolean(project.beforeImage && project.afterImage);

  return (
    <article
      id={`job-${project.id}`}
      className={`scroll-mt-24 overflow-clip rounded-2xl border border-border bg-background ${className}`}
    >
      {hasBeforeAfter ? (
        <div
          className="grid grid-cols-2 gap-px bg-border"
          {...(photoZone ? { 'data-photo-zone': '' } : {})}
        >
          <div className="relative aspect-square">
            <Image
              src={project.beforeImage!}
              alt={`${project.title} — before, ${project.location}`}
              fill
              priority={priority}
              quality={90}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 40vw, 420px"
              className="object-contain bg-surface"
            />
            <span className="absolute left-2 top-2 rounded bg-background/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-foreground">
              Before
            </span>
          </div>
          <div className="relative aspect-square">
            <Image
              src={project.afterImage!}
              alt={`${project.title} — after, ${project.location}`}
              fill
              priority={priority}
              quality={90}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 40vw, 420px"
              className="object-contain bg-surface"
            />
            <span className="absolute left-2 top-2 rounded bg-background/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-foreground">
              After
            </span>
          </div>
        </div>
      ) : (
        <div>
          <div
            className="relative aspect-[3/2] bg-[color-mix(in_srgb,var(--foreground)_10%,var(--background))]"
            {...(photoZone ? { 'data-photo-zone': '' } : {})}
          >
            {keepShotsMounted
              ? shots.map((src) => {
                  const visible = src === current;
                  return (
                    <Image
                      key={src}
                      src={src}
                      alt={visible ? `${project.title}, ${project.location}` : ''}
                      fill
                      priority={priority && visible}
                      loading="eager"
                      quality={90}
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 640px"
                      className={`object-contain ${visible ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
                    />
                  );
                })
              : (
                  <Image
                    src={current}
                    alt={`${project.title}, ${project.location}`}
                    fill
                    priority={priority}
                    quality={90}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 640px"
                    className="object-contain"
                  />
                )}
          </div>
          {shots.length > 1 && (
            <PhotoThumbStrip activeIndex={active}>
              {shots.map((src, index) => (
                <button
                  key={src}
                  type="button"
                  data-photo-thumb=""
                  onClick={(event) => {
                    event.stopPropagation();
                    setActive(index);
                  }}
                  aria-label={`Photo ${index + 1} of ${shots.length}`}
                  aria-pressed={index === active}
                  className={`relative z-20 h-14 w-16 shrink-0 overflow-hidden rounded border ${
                    index === active ? 'border-accent' : 'border-border'
                  }`}
                >
                  <Image
                    src={src}
                    alt=""
                    fill
                    loading="eager"
                    quality={90}
                    className="pointer-events-none object-cover"
                    sizes="96px"
                  />
                </button>
              ))}
            </PhotoThumbStrip>
          )}
        </div>
      )}
      <div className="p-5">
        <div className="text-xs font-semibold uppercase tracking-wide text-accent">
          {TRADE_LABELS[project.trade]}
        </div>
        <h3 className="mt-1 text-lg font-semibold text-foreground">{project.title}</h3>
        <p className="mt-1 text-sm text-foreground/60">{project.location}</p>
        <p className="mt-3 text-sm text-foreground/80">{project.description}</p>
      </div>
    </article>
  );
}

export function GalleryGrid({ projects }: { projects: GalleryProject[] }) {
  if (projects.length === 0) return null;

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project, index) => (
        <ProjectCard key={project.id} project={project} priority={index === 0} />
      ))}
    </div>
  );
}
