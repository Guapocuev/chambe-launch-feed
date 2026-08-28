'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Logo } from '@/components/Logo';
import { isApprenticeArea, isContractorArea } from '@/lib/contractor-area';

const LINKS = [
  { href: '/how-it-works', label: 'How It Works' },
  { href: '/about', label: 'About' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/contact', label: 'Contact' },
];

const estimateClass =
  'rounded-full bg-accent px-3 py-2 text-center text-xs font-semibold text-inverse transition hover:bg-accent-dark sm:px-5 sm:py-2.5 sm:text-sm';

export function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  if (isApprenticeArea(pathname)) {
    return (
      <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-md items-center px-5">
          <Logo size="md" href="/apprentice" label="Your hours" />
        </div>
      </header>
    );
  }

  if (isContractorArea(pathname)) {
    return (
      <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-md items-center px-5">
          <Logo size="md" href="/contractor" label="Your jobs" />
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
        <Logo size="lg" />

        <nav className="hidden items-center gap-8 md:flex">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition hover:text-brand ${
                pathname === link.href ? 'text-brand' : 'text-foreground/80'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/apply"
            className="hidden text-sm font-medium text-foreground/80 transition hover:text-brand md:inline"
          >
            Become a Contractor
          </Link>
          <Link href="/get-a-quote" className={`${estimateClass} whitespace-nowrap`}>
            Get a Free Estimate
          </Link>
          <button
            type="button"
            className="flex items-center justify-center rounded-md p-2 md:hidden"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <span className="sr-only">Toggle menu</span>
            <div className="flex h-5 w-6 flex-col justify-between">
              <span className={`h-0.5 w-full bg-foreground transition ${open ? 'translate-y-2.5 rotate-45' : ''}`} />
              <span className={`h-0.5 w-full bg-foreground transition ${open ? 'opacity-0' : ''}`} />
              <span className={`h-0.5 w-full bg-foreground transition ${open ? '-translate-y-2 -rotate-45' : ''}`} />
            </div>
          </button>
        </div>
      </div>

      {open && (
        <nav className="flex flex-col gap-1 border-t border-border px-6 py-4 md:hidden">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-md px-2 py-2 text-sm font-medium text-foreground/80 hover:bg-surface"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/apply"
            onClick={() => setOpen(false)}
            className="rounded-md px-2 py-2 text-sm font-medium text-foreground/80 hover:bg-surface"
          >
            Become a Contractor
          </Link>
        </nav>
      )}
    </header>
  );
}
