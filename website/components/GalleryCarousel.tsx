'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { GalleryProject } from '@/lib/gallery-data';
import { ProjectCard } from '@/components/GalleryGrid';

function cardStep(scroller: HTMLElement): number {
  const card = scroller.querySelector<HTMLElement>('[data-carousel-card]');
  if (!card) return Math.round(scroller.clientWidth * 0.8);
  const gap = parseFloat(getComputedStyle(scroller).columnGap || getComputedStyle(scroller).gap) || 24;
  return card.offsetWidth + gap;
}

export function GalleryCarousel({ projects }: { projects: GalleryProject[] }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const targetLeft = useRef(0);
  const programmatic = useRef(false);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);

  const update = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const max = Math.max(0, el.scrollWidth - el.clientWidth);
    setCanPrev(el.scrollLeft > 8);
    setCanNext(el.scrollLeft < max - 8);
  }, []);

  useLayoutEffect(() => {
    update();
  }, [projects, update]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    update();

    let settle: number | undefined;
    const onScroll = () => {
      update();
      if (!programmatic.current) targetLeft.current = el.scrollLeft;
      window.clearTimeout(settle);
      settle = window.setTimeout(() => {
        programmatic.current = false;
        targetLeft.current = el.scrollLeft;
      }, 140);
    };
    const onScrollEnd = () => {
      programmatic.current = false;
      targetLeft.current = el.scrollLeft;
      update();
    };

    el.addEventListener('scroll', onScroll, { passive: true });
    el.addEventListener('scrollend', onScrollEnd);
    const ro = new ResizeObserver(() => {
      const max = Math.max(0, el.scrollWidth - el.clientWidth);
      targetLeft.current = Math.min(targetLeft.current, max);
      update();
    });
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', onScroll);
      el.removeEventListener('scrollend', onScrollEnd);
      window.clearTimeout(settle);
      ro.disconnect();
    };
  }, [projects, update]);

  function scrollByCard(direction: -1 | 1) {
    const el = scrollerRef.current;
    if (!el) return;
    const max = Math.max(0, el.scrollWidth - el.clientWidth);
    const next = Math.max(0, Math.min(max, targetLeft.current + direction * cardStep(el)));
    targetLeft.current = next;
    programmatic.current = true;
    el.scrollLeft = next;
  }

  if (projects.length === 0) return null;

  return (
    <div className="md:grid md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center md:gap-3">
      <button
        type="button"
        aria-label="Previous jobs"
        disabled={!canPrev}
        onClick={() => scrollByCard(-1)}
        className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-background text-foreground shadow-sm transition hover:border-brand disabled:cursor-not-allowed disabled:opacity-25 disabled:hover:border-border md:flex"
      >
        <Chevron dir="left" />
      </button>

      <div
        ref={scrollerRef}
        tabIndex={0}
        role="region"
        aria-roledescription="carousel"
        aria-label="Completed jobs"
        onScroll={update}
        onKeyDown={(event) => {
          if (event.key === 'ArrowLeft') {
            event.preventDefault();
            scrollByCard(-1);
          } else if (event.key === 'ArrowRight') {
            event.preventDefault();
            scrollByCard(1);
          }
        }}
        className="chambe-h-scroll flex w-full min-w-0 snap-x snap-mandatory gap-6 overflow-x-auto overscroll-x-contain touch-pan-x pb-1 outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        {projects.map((project, index) => (
          <div
            key={project.id}
            data-carousel-card
            className="w-[min(24rem,calc(100vw-4.75rem))] shrink-0 snap-start sm:w-[22rem] lg:w-[24rem]"
          >
            <ProjectCard project={project} priority={index < 2} className="h-full" />
          </div>
        ))}
      </div>

      <button
        type="button"
        aria-label="Next jobs"
        disabled={!canNext}
        onClick={() => scrollByCard(1)}
        className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-background text-foreground shadow-sm transition hover:border-brand disabled:cursor-not-allowed disabled:opacity-25 disabled:hover:border-border md:flex"
      >
        <Chevron dir="right" />
      </button>
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
