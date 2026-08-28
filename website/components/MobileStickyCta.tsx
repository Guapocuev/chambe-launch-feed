'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { trackEvent } from '@/lib/analytics';
import { CONTACT_PHONE, CONTACT_PHONE_TEL } from '@/lib/site';
import { isAppArea } from '@/lib/contractor-area';

const HIDDEN_ON = new Set(['/get-a-quote', '/apply']);

export function MobileStickyCta() {
  const pathname = usePathname();

  if (HIDDEN_ON.has(pathname) || isAppArea(pathname)) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-4 py-3 backdrop-blur md:hidden"
      role="region"
      aria-label="Quick actions"
    >
      <div className="mx-auto flex max-w-lg items-center gap-2">
        {CONTACT_PHONE && (
          <a
            href={CONTACT_PHONE_TEL}
            onClick={() => trackEvent({ name: 'phone_click', params: { location: 'mobile_sticky' } })}
            className="shrink-0 rounded-full border border-border px-4 py-3 text-sm font-semibold text-foreground transition hover:border-brand"
          >
            Call
          </a>
        )}
        <Link
          href="/get-a-quote"
          onClick={() =>
            trackEvent({
              name: 'cta_click',
              params: { location: 'mobile_sticky', label: 'Get a Free Estimate', href: '/get-a-quote' },
            })
          }
          className="flex-1 rounded-full bg-accent py-3 text-center text-sm font-semibold text-brand transition hover:bg-accent-dark"
        >
          Get a Free Estimate
        </Link>
      </div>
    </div>
  );
}
