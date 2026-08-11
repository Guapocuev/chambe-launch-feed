'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const LINKS = [
  { href: '/how-it-works', label: 'How It Works' },
  { href: '/about', label: 'About' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/contact', label: 'Contact' },
];

export function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-xl font-bold tracking-tight text-brand dark:text-brand">
          Chambé
        </Link>

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

        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/apply"
            className="text-sm font-medium text-foreground/80 transition hover:text-brand"
          >
            Become a Contractor
          </Link>
          <Link
            href="/get-a-quote"
            className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-dark"
          >
            Get a Free Estimate
          </Link>
        </div>

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
          <Link
            href="/get-a-quote"
            onClick={() => setOpen(false)}
            className="mt-2 rounded-full bg-accent px-5 py-2.5 text-center text-sm font-semibold text-white"
          >
            Get a Free Estimate
          </Link>
        </nav>
      )}
    </header>
  );
}
