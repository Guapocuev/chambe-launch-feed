import Link from 'next/link';
import { GalleryGrid } from '@/components/GalleryGrid';
import { MapTeaser } from '@/components/MapTeaser';
import { galleryProjects } from '@/lib/gallery-data';

const TRUST_SIGNALS = [
  {
    title: 'Vetted Toronto contractors',
    detail: 'Background-checked and insured. No unlicensed stand-ins.',
  },
  {
    title: 'AI-priced in minutes',
    detail: 'An itemized range from our pricing engine — not a sales call.',
  },
  {
    title: 'Local, not a national marketplace',
    detail: 'Toronto-built, GTA-only. That is the whole market.',
  },
];

const STEPS = [
  {
    number: '1',
    title: 'Tell us the job',
    description:
      'Describe what needs fixing and share your address. Takes about two minutes.',
  },
  {
    number: '2',
    title: 'Get an instant AI estimate',
    description:
      'Our pricing engine gives you a real, itemized price range in seconds — not a guess, not a sales call.',
  },
  {
    number: '3',
    title: 'Get matched with a vetted pro',
    description:
      'We match you with a background-checked, insured contractor in your neighbourhood who is ready to take the job.',
  },
];

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="border-b border-border bg-surface">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 py-20 md:grid-cols-2 md:items-center md:py-28">
          <div>
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl">
              Hire a trusted Toronto contractor{' '}
              <span className="text-brand">— without the hassle.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-foreground/70">
              Tell us what you need, get an instant AI-powered estimate, and get matched with a
              vetted local pro. No cold calls, no guesswork, no surprises.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/get-a-quote"
                className="rounded-full bg-accent px-7 py-3.5 text-center text-sm font-semibold text-brand transition hover:bg-accent-dark"
              >
                Get a Free Estimate
              </Link>
              <Link
                href="/how-it-works"
                className="rounded-full border border-border px-7 py-3.5 text-center text-sm font-semibold text-foreground transition hover:border-brand hover:text-brand"
              >
                See how it works
              </Link>
            </div>
          </div>
          <div className="hidden justify-self-end rounded-3xl bg-brand/5 p-10 md:block">
            <div className="rounded-2xl border border-border bg-background p-6 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-wide text-accent">
                Instant estimate
              </div>
              <div className="mt-2 text-2xl font-bold text-foreground">$270 – $325</div>
              <div className="mt-1 text-sm text-foreground/60">Kitchen outlet repair · Downtown Toronto</div>
              <div className="mt-4 rounded-lg bg-surface px-3 py-2 text-xs text-foreground/60">
                Matched with 2 vetted electricians nearby
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust signals */}
      <section className="border-b border-border">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 md:grid-cols-3 md:gap-0 md:divide-x md:divide-border">
          {TRUST_SIGNALS.map((signal) => (
            <div key={signal.title} className="md:px-8 first:md:pl-0 last:md:pr-0">
              <div className="h-1 w-8 rounded-full bg-accent" aria-hidden="true" />
              <p className="mt-4 text-lg font-semibold text-foreground">{signal.title}</p>
              <p className="mt-2 text-sm text-foreground/70">{signal.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works teaser */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">How Chambé works</h2>
          <p className="mx-auto mt-3 max-w-xl text-foreground/70">
            Three steps between &quot;my faucet is leaking&quot; and a pro showing up to fix it.
          </p>
        </div>
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {STEPS.map((step) => (
            <div key={step.number} className="rounded-2xl border border-border p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-sm font-bold text-brand">
                {step.number}
              </div>
              <h3 className="mt-4 text-lg font-semibold text-foreground">{step.title}</h3>
              <p className="mt-2 text-sm text-foreground/70">{step.description}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Link href="/how-it-works" className="text-sm font-semibold text-brand hover:underline">
            More on how it works →
          </Link>
        </div>
      </section>

      {/* Mission teaser */}
      <section className="border-y border-border bg-surface">
        <div className="mx-auto max-w-3xl px-6 py-20 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Hiring a contractor shouldn&apos;t feel like a gamble.
          </h2>
          <p className="mt-4 text-foreground/70">
            Chambé exists because too many homeowners in the GTA have been burned by no-shows,
            vague quotes, and unlicensed work. We built a marketplace where every contractor is
            vetted, every price is transparent, and every job is tracked from request to done.
          </p>
          <Link href="/about" className="mt-6 inline-block text-sm font-semibold text-brand hover:underline">
            More about our mission →
          </Link>
        </div>
      </section>

      <MapTeaser />

      {/* Gallery teaser */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Real jobs, real results</h2>
            <p className="mt-2 text-foreground/70">A look at recent work from Chambé contractors.</p>
          </div>
          <Link href="/gallery" className="hidden shrink-0 text-sm font-semibold text-brand hover:underline sm:block">
            Explore past work →
          </Link>
        </div>
        <div className="mt-10">
          <GalleryGrid projects={galleryProjects.slice(0, 3)} />
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-inverse">
        <div className="mx-auto max-w-3xl px-6 py-16 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-inverse-foreground">Ready to get it fixed?</h2>
          <p className="mt-3 text-inverse-foreground/70">
            Get a free, instant estimate — no account, no phone call required.
          </p>
          <Link
            href="/get-a-quote"
            className="mt-6 inline-block rounded-full bg-accent px-7 py-3.5 text-sm font-semibold text-brand transition hover:bg-accent-dark"
          >
            Get a Free Estimate
          </Link>
        </div>
      </section>
    </>
  );
}
