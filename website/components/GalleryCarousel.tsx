'use client';

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import type { GalleryProject } from '@/lib/gallery-data';
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
 * Scale and arc spacing so consecutive cards never overlap.
 * dx/du = cardWidth * scale(u) + gap  ⇒  |x(t+1)-x(t)| = average visual
 * widths + gap, which is exactly the AABB non-overlap requirement.
 */
const SCALE_K = 0.18;
const SCALE_MIN = 0.62;
const SLOT_GAP = 24;
const ARC_Y = 28;
const VISIBLE_SLOTS = 1.55;

function scaleAt(abs: number) {
  return Math.max(SCALE_MIN, 1 - abs * SCALE_K);
}

function arcX(offset: number, cardWidth: number) {
  const abs = Math.abs(offset);
  if (abs === 0) return 0;
  const knee = (1 - SCALE_MIN) / SCALE_K;
  const throughKnee =
    cardWidth * (knee - (SCALE_K * knee * knee) / 2) + SLOT_GAP * knee;
  const integrate = (to: number) => {
    if (to <= 0) return 0;
    if (to <= knee) {
      return cardWidth * (to - (SCALE_K * to * to) / 2) + SLOT_GAP * to;
    }
    return throughKnee + (cardWidth * SCALE_MIN + SLOT_GAP) * (to - knee);
  };
  return Math.sign(offset) * integrate(abs);
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
const MOTION_EASE = 'cubic-bezier(0.22, 0.61, 0.36, 1)';
const MOTION_MS = 560;
const MOTION = `transform ${MOTION_MS}ms ${MOTION_EASE}`;
/** One full job every ~6s — faster than 12s, still ambient. */
const AUTO_PERIOD_SEC = 6;
const AUTO_RESUME_MS = 1400;
const CENTER_SLOT = 0.4;

function bezier(t: number, a: number, b: number) {
  const u = 1 - t;
  return 3 * u * u * t * a + 3 * u * t * t * b + t * t * t;
}

function bezierD(t: number, a: number, b: number) {
  const u = 1 - t;
  return 3 * u * u * a + 6 * u * t * (b - a) + 3 * t * t * (1 - b);
}

/** Same curve as MOTION_EASE: cubic-bezier(0.22, 0.61, 0.36, 1). */
function motionEase(t: number) {
  let x = t;
  for (let i = 0; i < 6; i += 1) {
    const d = bezierD(x, 0.22, 0.36);
    if (Math.abs(d) < 1e-6) break;
    x -= (bezier(x, 0.22, 0.36) - t) / d;
  }
  return bezier(x, 0.61, 1);
}

function poseTransform(x: number, y: number, z: number, rotateX: number, scale: number) {
  return `translate3d(-50%, -50%, 0) translate3d(${x}px, ${y}px, ${z}px) rotateX(${rotateX}deg) scale(${scale})`;
}

function cardPose(offset: number, cardWidth: number) {
  const abs = Math.abs(offset);
  const visible = abs <= VISIBLE_SLOTS;
  const scale = scaleAt(abs);
  const x = arcX(offset, cardWidth);
  const y = ARC_Y * abs * abs;
  const z = -abs * 36;
  return {
    isFront: abs < CENTER_SLOT,
    visible,
    x,
    y,
    z,
    rotateX: 0,
    scale,
    zIndex: Math.round(1000 - abs * 200),
  };
}

function cardTransform(offset: number, cardWidth: number) {
  const pose = cardPose(offset, cardWidth);
  return {
    ...pose,
    opacity: '1' as const,
    transform: poseTransform(pose.x, pose.y, pose.z, pose.rotateX, pose.scale),
  };
}

export function GalleryCarousel({ projects }: { projects: GalleryProject[] }) {
  const t = useTranslations('Gallery');
  const count = projects.length;
  const labelId = useId();
  const stageRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef(0);
  const dragRef = useRef<DragState | null>(null);
  const didDragRef = useRef(false);
  const photoByIdRef = useRef<Record<string, number>>({});
  const modalOpenRef = useRef(false);
  const metricsRef = useRef({ cardWidth: 340 });
  const dragOffsetRef = useRef(0);
  const paintRafRef = useRef(0);
  const autoOffsetRef = useRef(0);
  const autoHoldRef = useRef(false);
  const autoEnabledRef = useRef(true);
  const expandReadyRef = useRef(false);
  const autoResumeAtRef = useRef(0);
  const autoLastTsRef = useRef(0);
  const autoRafRef = useRef(0);
  const skipSnapPaintRef = useRef(false);
  const reducedMotionRef = useRef(false);
  const flippingRef = useRef(false);
  const flipRafRef = useRef(0);
  const autoAccRef = useRef(0);
  const [active, setActive] = useState(0);
  const [stageWidth, setStageWidth] = useState(720);
  const [photoById, setPhotoById] = useState<Record<string, number>>({});
  const [modalProject, setModalProject] = useState<GalleryProject | null>(null);
  const [mounted, setMounted] = useState(false);

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
        const painted = cardTransform(ringDelta(index, activeIndex + drag, count), metrics.cardWidth);
        node.style.transform = painted.transform;
        node.style.transformOrigin = '50% 92%';
        node.style.zIndex = String(painted.zIndex);
        node.style.opacity = '1';
        node.style.filter = 'none';
        node.style.visibility = painted.visible ? 'visible' : 'hidden';
        node.style.pointerEvents = painted.visible ? 'auto' : 'none';
        node.style.transition = instant ? 'none' : MOTION;
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

  const paintFlip = useCallback(
    (from: number, to: number, p: number) => {
      const stage = stageRef.current;
      if (!stage || count < 1) return;
      const cardWidth = metricsRef.current.cardWidth;
      const fromId = projects[from]?.id;
      const toId = projects[to]?.id;
      projects.forEach((project, index) => {
        const node = stage.querySelector<HTMLElement>(`[data-rolodex-card="${CSS.escape(project.id)}"]`);
        if (!node) return;
        const start = cardPose(ringDelta(index, from, count), cardWidth);
        const end = cardPose(ringDelta(index, to, count), cardWidth);
        let x = start.x + (end.x - start.x) * p;
        let y = start.y + (end.y - start.y) * p;
        let z = start.z + (end.z - start.z) * p;
        let rotateX = 0;
        let scale = start.scale + (end.scale - start.scale) * p;
        let zIndex = Math.round(start.zIndex + (end.zIndex - start.zIndex) * p);
        let visible = start.visible || end.visible;

        if (project.id === fromId) {
          // Tip forward/down over the bottom hinge, receding into the stack.
          rotateX = 86 * p;
          y = start.y + 96 * p;
          z = start.z - 210 * p;
          scale = start.scale * (1 - 0.08 * p);
          zIndex = Math.round(2600 * (1 - p) + 60);
          visible = true;
        } else if (project.id === toId) {
          // Rise from behind the stack, unfolding to face the viewer.
          const rise = p;
          x = end.x + (start.x - end.x) * (1 - rise) * 0.18;
          y = end.y + 52 * (1 - rise);
          z = end.z - 260 * (1 - rise);
          rotateX = -86 * (1 - rise);
          scale = 0.84 + (end.scale - 0.84) * rise;
          zIndex = rise < 0.42 ? 380 : 2800;
          visible = true;
        }

        node.style.transition = 'none';
        node.style.transformOrigin = '50% 92%';
        node.style.transform = poseTransform(x, y, z, rotateX, scale);
        node.style.zIndex = String(zIndex);
        node.style.opacity = '1';
        node.style.filter = 'none';
        node.style.visibility = visible ? 'visible' : 'hidden';
        node.style.pointerEvents = visible ? 'auto' : 'none';
        node.setAttribute('aria-hidden', project.id === toId && p > 0.55 ? 'false' : 'true');
      });
    },
    [count, projects],
  );

  const startFlip = useCallback(
    (dir: 1 | -1) => {
      if (count < 2 || flippingRef.current) return;
      const from = activeRef.current;
      const to = (from + dir + count) % count;
      if (reducedMotionRef.current) {
        activeRef.current = to;
        dragOffsetRef.current = 0;
        autoOffsetRef.current = 0;
        autoAccRef.current = 0;
        skipSnapPaintRef.current = true;
        setActive(to);
        paintFan(to, 0, true);
        return;
      }
      if (flipRafRef.current) cancelAnimationFrame(flipRafRef.current);
      flippingRef.current = true;
      autoHoldRef.current = true;
      autoOffsetRef.current = 0;
      const t0 = performance.now();
      const tick = (now: number) => {
        const p = Math.min(1, (now - t0) / MOTION_MS);
        paintFlip(from, to, motionEase(p));
        if (p < 1) {
          flipRafRef.current = requestAnimationFrame(tick);
          return;
        }
        flippingRef.current = false;
        flipRafRef.current = 0;
        activeRef.current = to;
        dragOffsetRef.current = 0;
        autoOffsetRef.current = 0;
        autoAccRef.current = 0;
        skipSnapPaintRef.current = true;
        setActive(to);
        paintFan(to, 0, true);
        if (autoEnabledRef.current && !modalOpenRef.current) {
          autoHoldRef.current = false;
          autoLastTsRef.current = 0;
        }
      };
      flipRafRef.current = requestAnimationFrame(tick);
    },
    [count, paintFan, paintFlip],
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
      autoOffsetRef.current = 0;
      autoAccRef.current = 0;
      setActive(wrapped);
      const stage = stageRef.current;
      if (stage) stage.style.cursor = '';
      paintFan(wrapped, 0, false);
    },
    [count, paintFan],
  );

  const holdAuto = useCallback(() => {
    autoHoldRef.current = true;
    autoResumeAtRef.current = 0;
    autoLastTsRef.current = 0;
    if (flipRafRef.current) {
      cancelAnimationFrame(flipRafRef.current);
      flipRafRef.current = 0;
    }
    if (flippingRef.current) {
      flippingRef.current = false;
      autoOffsetRef.current = 0;
      paintFan(activeRef.current, 0, true);
      return;
    }
    const frac = autoOffsetRef.current;
    if (frac === 0) return;
    autoOffsetRef.current = 0;
    if (count >= 2 && Math.abs(frac) >= 0.5) {
      const dir = frac > 0 ? 1 : -1;
      const wrapped = ((activeRef.current + dir) % count + count) % count;
      skipSnapPaintRef.current = true;
      activeRef.current = wrapped;
      setActive(wrapped);
      paintFan(wrapped, 0, true);
      return;
    }
    paintFan(activeRef.current, 0, true);
  }, [count, paintFan]);

  const stopAuto = useCallback(() => {
    autoEnabledRef.current = false;
    autoHoldRef.current = true;
    autoResumeAtRef.current = 0;
    autoLastTsRef.current = 0;
  }, []);

  const releaseAuto = useCallback(() => {
    if (!autoEnabledRef.current) {
      autoHoldRef.current = true;
      return;
    }
    autoHoldRef.current = false;
    autoResumeAtRef.current = performance.now() + AUTO_RESUME_MS;
    autoLastTsRef.current = 0;
  }, []);

  const step = useCallback(
    (direction: -1 | 1) => {
      startFlip(direction);
    },
    [startFlip],
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

  const selectCard = useCallback(
    (project: GalleryProject, index: number) => {
      if (didDragRef.current) return;
      const visual = ringDelta(index, activeRef.current + autoOffsetRef.current, count);
      const centered = Math.abs(visual) < CENTER_SLOT;
      if (centered && expandReadyRef.current) {
        openModal(project);
        return;
      }
      stopAuto();
      expandReadyRef.current = true;
      autoOffsetRef.current = 0;
      const delta = ringDelta(index, activeRef.current, count);
      if (Math.abs(delta) === 1) startFlip(delta > 0 ? 1 : -1);
      else go(index);
    },
    [count, go, openModal, startFlip, stopAuto],
  );

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
    if (flippingRef.current) return;
    if (skipSnapPaintRef.current) {
      skipSnapPaintRef.current = false;
      paintFan(active, autoOffsetRef.current, true);
      return;
    }
    paintFan(active, autoHoldRef.current ? 0 : autoOffsetRef.current, autoOffsetRef.current !== 0);
  }, [active, paintFan, stageWidth, count]);

  useEffect(() => {
    if (!modalProject) return;
    holdAuto();
    return () => {
      releaseAuto();
    };
  }, [holdAuto, modalProject, releaseAuto]);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => {
      reducedMotionRef.current = media.matches;
      if (media.matches) {
        autoOffsetRef.current = 0;
        autoLastTsRef.current = 0;
      }
    };
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    if (count < 2) return;

    const tick = (ts: number) => {
      autoRafRef.current = requestAnimationFrame(tick);
      if (
        !autoEnabledRef.current ||
        reducedMotionRef.current ||
        autoHoldRef.current ||
        flippingRef.current ||
        modalOpenRef.current ||
        dragRef.current ||
        document.hidden ||
        ts < autoResumeAtRef.current
      ) {
        autoLastTsRef.current = 0;
        return;
      }
      if (!autoLastTsRef.current) {
        autoLastTsRef.current = ts;
        return;
      }
      const dt = Math.min(0.05, (ts - autoLastTsRef.current) / 1000);
      autoLastTsRef.current = ts;
      autoAccRef.current += dt;
      if (autoAccRef.current >= AUTO_PERIOD_SEC) {
        autoAccRef.current = 0;
        startFlip(1);
      }
    };

    autoRafRef.current = requestAnimationFrame(tick);
    return () => {
      if (autoRafRef.current) cancelAnimationFrame(autoRafRef.current);
      autoRafRef.current = 0;
      if (flipRafRef.current) cancelAnimationFrame(flipRafRef.current);
      flipRafRef.current = 0;
    };
  }, [count, paintFan, startFlip]);

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
      holdAuto();
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
      if (!dragState) {
        releaseAuto();
        return;
      }
      if (event.pointerId !== dragState.pointerId) return;
      const deltaX = event.clientX - dragState.startX;
      release(event.pointerId);
      dragRef.current = null;

      if (dragState.axis !== 'x') {
        resetDrag();
        releaseAuto();
        return;
      }

      if (dragState.mode === 'photo' && dragState.projectId) {
        if (deltaX <= -PHOTO_COMMIT_PX) {
          stepPhoto(dragState.projectId, dragState.photoCount, 1);
        } else if (deltaX >= PHOTO_COMMIT_PX) {
          stepPhoto(dragState.projectId, dragState.photoCount, -1);
        }
        el.style.cursor = '';
        releaseAuto();
        return;
      }

      if (deltaX <= -FAN_COMMIT_PX) go(activeRef.current + 1);
      else if (deltaX >= FAN_COMMIT_PX) go(activeRef.current - 1);
      else resetDrag();
      releaseAuto();
    };

    const onCancel = (event: PointerEvent) => {
      const dragState = dragRef.current;
      if (!dragState || event.pointerId !== dragState.pointerId) return;
      release(event.pointerId);
      resetDrag();
      releaseAuto();
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
        releaseAuto();
        return;
      }
      const steps = accum > 0 ? 1 : -1;
      go(activeRef.current + steps);
      releaseAuto();
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
      if (!wheel.accum) holdAuto();
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
  }, [count, go, holdAuto, paintFan, paintFanLive, projects, releaseAuto, stepPhoto]);

  if (count === 0) return null;

  const cardWidth = Math.min(340, Math.max(252, stageWidth * 0.46));
  const cardHeight = Math.round(cardWidth * 1.38);
  metricsRef.current = { cardWidth };
  const current = projects[active];

  return (
    <>
      <div className="md:grid md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center md:gap-3">
        <button
          type="button"
          aria-label={t('previousJobs')}
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
          className="relative z-0 h-[32rem] w-full min-w-0 cursor-grab select-none overflow-visible outline-none focus-visible:ring-2 focus-visible:ring-accent sm:h-[34rem]"
          style={{ touchAction: 'pan-y', perspective: '1180px', perspectiveOrigin: '50% 42%' }}
        >
          <p id={labelId} className="sr-only">
            {t('completedJobs')} {current ? `${current.title}, ${current.location}.` : ''}{' '}
            {t('completedJobsHelp')}
          </p>

          <div className="absolute inset-0 [transform-style:preserve-3d]">
            {projects.map((project, index) => {
              const offset = ringDelta(index, active, count);
              if (Math.abs(offset) > VISIBLE_SLOTS + 1) return null;
              const painted = cardTransform(offset, cardWidth);
              const shots = projectShots(project);

              return (
                <div
                  key={project.id}
                  data-rolodex-card={project.id}
                  aria-hidden={!painted.isFront}
                  className="absolute left-1/2 top-1/2 cursor-pointer overflow-hidden rounded-2xl bg-background will-change-transform [backface-visibility:hidden] [isolation:isolate] [transform-style:preserve-3d]"
                  style={{
                    boxSizing: 'border-box',
                    width: cardWidth,
                    height: cardHeight,
                    minWidth: cardWidth,
                    maxWidth: cardWidth,
                    minHeight: cardHeight,
                    maxHeight: cardHeight,
                    contain: 'strict',
                    overflow: 'hidden',
                    zIndex: painted.zIndex,
                    opacity: 1,
                    visibility: painted.visible ? 'visible' : 'hidden',
                    pointerEvents: painted.visible ? 'auto' : 'none',
                    transform: painted.transform,
                    transformOrigin: '50% 92%',
                    filter: 'none',
                  }}
                  onClick={(event) => {
                    if ((event.target as HTMLElement).closest('[data-photo-thumb], [data-photo-thumbs]')) return;
                    selectCard(project, index);
                  }}
                >
                  <div className="h-full max-h-full min-h-0 w-full overflow-hidden rounded-2xl shadow-[0_14px_32px_rgba(0,0,0,0.18)]">
                    <ProjectCard
                      project={project}
                      priority={painted.isFront}
                      photoZone
                      showThumbs={painted.isFront}
                      fixedFrame
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
          aria-label={t('nextJobs')}
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
  const t = useTranslations('Gallery');
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
          aria-label={t('closeJobDetails')}
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
            className="object-cover"
          />
          {shots.length > 1 && (
            <>
              <button
                type="button"
                aria-label={t('previousPhoto')}
                onClick={() => goPhoto(-1)}
                className="absolute left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background/90 text-foreground shadow-sm"
              >
                <Chevron dir="left" />
              </button>
              <button
                type="button"
                aria-label={t('nextPhoto')}
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
                aria-label={t('photoOf', { n: shotIndex + 1, total: shots.length })}
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
            {t(project.trade)}
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
