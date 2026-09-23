'use client';

import Image from 'next/image';
import { useId, useRef, useState } from 'react';

export function BeforeAfterSlider({
  beforeSrc,
  afterSrc,
  beforeAlt,
  afterAlt,
  beforeLabel,
  afterLabel,
  priority = false,
}: {
  beforeSrc: string;
  afterSrc: string;
  beforeAlt: string;
  afterAlt: string;
  beforeLabel: string;
  afterLabel: string;
  priority?: boolean;
}) {
  const sliderId = useId();
  const frameRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(50);
  const remote = (src: string) => src.startsWith('http://') || src.startsWith('https://');

  function setFromClientX(clientX: number) {
    const frame = frameRef.current;
    if (!frame) return;
    const rect = frame.getBoundingClientRect();
    const next = ((clientX - rect.left) / rect.width) * 100;
    setPosition(Math.min(100, Math.max(0, next)));
  }

  return (
    <div
      ref={frameRef}
      className="relative aspect-[4/3] cursor-ew-resize touch-none overflow-hidden rounded-2xl border border-border bg-surface"
      onPointerDown={(event) => {
        if (event.pointerType === 'mouse' && event.button !== 0) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        setFromClientX(event.clientX);
      }}
      onPointerMove={(event) => {
        if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
        setFromClientX(event.clientX);
      }}
    >
      <Image
        src={afterSrc}
        alt={afterAlt}
        fill
        priority={priority}
        quality={90}
        unoptimized={remote(afterSrc)}
        sizes="(max-width: 768px) 100vw, 768px"
        className="pointer-events-none object-cover"
      />
      <div className="pointer-events-none absolute inset-0" style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}>
        <Image
          src={beforeSrc}
          alt={beforeAlt}
          fill
          priority={priority}
          quality={90}
          unoptimized={remote(beforeSrc)}
          sizes="(max-width: 768px) 100vw, 768px"
          className="object-cover"
        />
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 z-10 w-px bg-background shadow-[0_0_0_1px_rgba(0,0,0,0.12)]"
        style={{ left: `${position}%` }}
      >
        <span className="absolute left-1/2 top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background text-foreground shadow-sm">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M6 4.5 2.5 8 6 11.5M10 4.5 13.5 8 10 11.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </div>

      <span className="pointer-events-none absolute left-3 top-3 z-10 rounded-full bg-background/90 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-foreground">
        {beforeLabel}
      </span>
      <span className="pointer-events-none absolute right-3 top-3 z-10 rounded-full bg-background/90 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-foreground">
        {afterLabel}
      </span>

      <label htmlFor={sliderId} className="sr-only">
        {beforeLabel} / {afterLabel}
      </label>
      <input
        id={sliderId}
        type="range"
        min={0}
        max={100}
        value={position}
        onChange={(event) => setPosition(Number(event.target.value))}
        className="sr-only"
      />
    </div>
  );
}
