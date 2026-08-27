import type { Metadata } from 'next';
import Link from 'next/link';
import { CALLBACK_WINDOW, MATCH_WINDOW } from '@/lib/response-time';

export const metadata: Metadata = {
  title: 'How It Works',
  description: 'From describing your job to a vetted contractor showing up — how Chambé works, step by step.',
};

const STEPS = [
  {
    number: '1',
    title: 'Tell us the job',
    description:
      "Describe what needs fixing in your own words — a leaky faucet, a dead outlet, a fence that needs rebuilding. Add a few photos if you have them. It takes about two minutes, and there's no account to create.",
  },
  {
    number: '2',
    title: 'Get an instant AI estimate',
    description:
      'Our pricing engine reads your job description, matches it against a real GTA pricebook, and gives you an itemized price range in seconds. It is not a marketing number designed to get you on the phone — it is a deterministic estimate built from labor hours, material costs, and job complexity. If we are not confident enough in the estimate, we will say so and ask a couple of clarifying questions instead of guessing.',
  },
  {
    number: '3',
    title: 'Get matched with a vetted pro',
    description:
      `We match your job to background-checked, insured contractors who work in your neighbourhood and specialize in your trade, using a scoring system that weighs proximity, reliability, and responsiveness. ${MATCH_WINDOW} ${CALLBACK_WINDOW}`,
  },
];

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-20">
      <h1 className="text-4xl font-bold tracking-tight text-foreground">How Chambé works</h1>
      <p className="mt-4 max-w-2xl text-lg text-foreground/70">
        Three steps between describing a problem and a vetted pro fixing it — no cold calls, no
        five competing quotes to compare, no guesswork.
      </p>

      <div className="mt-14 space-y-10">
        {STEPS.map((step) => (
          <div key={step.number} className="flex gap-6">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-inverse text-lg font-bold text-inverse-foreground">
              {step.number}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">{step.title}</h2>
              <p className="mt-2 text-foreground/70">{step.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-16 rounded-2xl border border-border bg-surface p-8 text-center">
        <h2 className="text-2xl font-bold text-foreground">Ready to see your estimate?</h2>
        <p className="mt-2 text-foreground/70">It takes about two minutes and costs nothing.</p>
        <Link
          href="/get-a-quote"
          className="mt-6 inline-block rounded-full bg-accent px-7 py-3.5 text-sm font-semibold text-inverse transition hover:bg-accent-dark"
        >
          Get a Free Estimate
        </Link>
      </div>
    </div>
  );
}
