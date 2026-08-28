'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { isAppArea } from '@/lib/contractor-area';

export function SiteMain({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const pad = isAppArea(pathname) ? '' : 'pb-24 md:pb-0';
  return <main className={`flex-1 ${pad}`}>{children}</main>;
}
