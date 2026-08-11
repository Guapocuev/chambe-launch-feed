import type { Metadata } from 'next';
import Link from 'next/link';
import { pageMetadata } from '@/lib/metadata';

export const metadata: Metadata = pageMetadata(
  'About',
  'Why Chambé exists and how we vet the contractors on our platform.',
  '/about',
);

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-20">
      <h1 className="text-4xl font-bold tracking-tight text-foreground">Our mission</h1>
      <p className="mt-6 text-lg leading-relaxed text-foreground/80">
        Hiring a contractor in Toronto shouldn&apos;t feel like a gamble. Too many homeowners in
        the GTA have a story about a no-show, a quote that tripled once the work started, or a
        job that just never got finished. That gap between &quot;I need this fixed&quot; and
        &quot;someone reliable is doing it, at a fair price&quot; is what Chambé is built to close.
      </p>

      <p className="mt-6 text-lg leading-relaxed text-foreground/80">
        We do that two ways. First, transparent pricing: every estimate comes from a deterministic
        pricing engine built on real GTA labor rates and material costs, not a sales rep&apos;s gut
        feeling. Second, a vetted contractor network: every pro on Chambé is background-checked,
        insured, and rated on real completed jobs — no unlicensed subcontractor showing up in
        their place.
      </p>

      <p className="mt-6 text-lg leading-relaxed text-foreground/80">
        We&apos;re a small, Toronto-based team, and we&apos;re just getting started — you&apos;re
        looking at one of the earliest versions of this site. If something feels rough around the
        edges, that&apos;s because we&apos;re building this in the open, market by market,
        contractor by contractor.
      </p>

      <div className="mt-14 grid gap-6 sm:grid-cols-2">
        <div className="rounded-2xl border border-border p-6">
          <h2 className="text-lg font-semibold text-foreground">For homeowners</h2>
          <p className="mt-2 text-sm text-foreground/70">
            A real price in seconds, matched with a contractor we&apos;d actually hire ourselves.
          </p>
          <Link href="/get-a-quote" className="mt-4 inline-block text-sm font-semibold text-brand hover:underline">
            Get a free estimate →
          </Link>
        </div>
        <div className="rounded-2xl border border-border p-6">
          <h2 className="text-lg font-semibold text-foreground">For contractors</h2>
          <p className="mt-2 text-sm text-foreground/70">
            Steady, qualified job leads in your trade and service area — no cold-calling for work.
          </p>
          <Link href="/apply" className="mt-4 inline-block text-sm font-semibold text-brand hover:underline">
            Apply as a contractor →
          </Link>
        </div>
      </div>
    </div>
  );
}
