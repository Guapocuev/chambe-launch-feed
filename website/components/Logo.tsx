'use client';

import Link from 'next/link';
import { useId } from 'react';

type LogoVariant = 'default' | 'inverse' | 'mark';
type LogoSize = 'sm' | 'md' | 'lg';

interface LogoProps {
  variant?: LogoVariant;
  size?: LogoSize;
  className?: string;
  href?: string;
  label?: string;
}

const MARK_SIZES = {
  sm: 'h-9 w-9',
  md: 'h-11 w-11',
  lg: 'h-14 w-14',
} as const;

const WORD_SIZES = {
  sm: 'text-sm tracking-[0.14em]',
  md: 'text-base tracking-[0.16em] sm:text-lg',
  lg: 'text-lg tracking-[0.18em] sm:text-xl',
} as const;

const YELLOW = '#f2c94c';
const YELLOW_PATH = 'M4 4 L28 24 L4 44 Z';
const METAL_PATH = 'M28 4 L44 24 L28 44 Z';
const ACCENT_PATH = 'M32 30 L40 38 L36 42 L28 34 Z';

function LogoMark({ inverse = false, className = '' }: { inverse?: boolean; className?: string }) {
  const uid = useId().replace(/:/g, '');
  const metalId = `logo-metal-${uid}`;
  const shineId = `logo-shine-${uid}`;

  const shapeStroke = inverse ? 'rgba(255,255,255,0.35)' : 'rgba(17,17,17,0.28)';
  const yellowStroke = inverse ? 'rgba(255,255,255,0.2)' : 'rgba(17,17,17,0.22)';

  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={metalId} x1="28" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
          {inverse ? (
            <>
              <stop offset="0%" stopColor="#f0f0f0" />
              <stop offset="40%" stopColor="#c8c8c8" />
              <stop offset="55%" stopColor="#a8a8a8" />
              <stop offset="100%" stopColor="#d4d4d4" />
            </>
          ) : (
            <>
              <stop offset="0%" stopColor="#3d3d3d" />
              <stop offset="38%" stopColor="#222222" />
              <stop offset="52%" stopColor="#181818" />
              <stop offset="100%" stopColor="#2a2a2a" />
            </>
          )}
        </linearGradient>
        <linearGradient id={shineId} x1="30" y1="6" x2="42" y2="38" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="white" stopOpacity="0" />
          <stop offset="42%" stopColor="white" stopOpacity={inverse ? '0.18' : '0.1'} />
          <stop offset="58%" stopColor="white" stopOpacity={inverse ? '0.08' : '0.04'} />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Yellow wedge — fill + shape outline */}
      <path
        d={YELLOW_PATH}
        fill={YELLOW}
        stroke={yellowStroke}
        strokeWidth="0.85"
        strokeLinejoin="round"
      />

      {/* Metallic chevron — fill + shape outline */}
      <path
        d={METAL_PATH}
        fill={`url(#${metalId})`}
        stroke={shapeStroke}
        strokeWidth="0.85"
        strokeLinejoin="round"
      />
      <path d={METAL_PATH} fill={`url(#${shineId})`} stroke="none" />

      {/* Yellow accent — fill + shape outline */}
      <path
        d={ACCENT_PATH}
        fill={YELLOW}
        stroke={yellowStroke}
        strokeWidth="0.75"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Logo({
  variant = 'default',
  size = 'md',
  className = '',
  href = '/',
  label = 'Chambé home',
}: LogoProps) {
  const isInverse = variant === 'inverse';
  const isMarkOnly = variant === 'mark';

  return (
    <Link
      href={href}
      className={`group inline-flex shrink-0 items-center gap-3 transition hover:opacity-90 ${className}`}
    >
      <LogoMark inverse={isInverse} className={MARK_SIZES[size]} />

      {!isMarkOnly && (
        <span
          className={`font-bold ${WORD_SIZES[size]} ${
            isInverse ? 'text-white' : 'text-brand'
          }`}
        >
          CHAMBÉ
        </span>
      )}

      <span className="sr-only">{label}</span>
    </Link>
  );
}
