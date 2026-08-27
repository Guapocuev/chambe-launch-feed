interface TimelineStep {
  title: string;
  description: string;
  status: 'done' | 'active' | 'upcoming';
}

interface PostSubmitTimelineProps {
  steps: TimelineStep[];
}

export function PostSubmitTimeline({ steps }: PostSubmitTimelineProps) {
  return (
    <ol className="mt-6 space-y-4 border-t border-border pt-6">
      {steps.map((step, i) => (
        <li key={step.title} className="flex gap-3">
          <div
            className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
              step.status === 'done'
                ? 'bg-accent text-brand'
                : step.status === 'active'
                  ? 'bg-brand text-background ring-2 ring-accent/40'
                  : 'border border-border bg-surface text-foreground/40'
            }`}
            aria-hidden="true"
          >
            {step.status === 'done' ? '✓' : i + 1}
          </div>
          <div>
            <div
              className={`text-sm font-medium ${
                step.status === 'upcoming' ? 'text-foreground/50' : 'text-foreground'
              }`}
            >
              {step.title}
            </div>
            <p className="mt-0.5 text-xs text-foreground/60">{step.description}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export const CONTRACTOR_FOLLOWUP =
  'Expect a call or text — usually within the hour during business hours.';

/** Homeowner post-submit steps. Use hasEstimate only when a price is actually on screen. */
export function QuoteSuccessTimeline({ hasEstimate }: { hasEstimate: boolean }) {
  return (
    <PostSubmitTimeline
      steps={
        hasEstimate
          ? [
              {
                title: 'Estimate received',
                description: 'Your price range is locked in based on the job details you provided.',
                status: 'done',
              },
              {
                title: 'Matching a vetted contractor',
                description: 'We are finding a licensed, insured pro in your neighbourhood right now.',
                status: 'active',
              },
              {
                title: 'Contractor reaches out',
                description: CONTRACTOR_FOLLOWUP,
                status: 'upcoming',
              },
            ]
          : [
              {
                title: 'Request received',
                description: 'Your job details are in. We are still preparing your estimate.',
                status: 'done',
              },
              {
                title: 'Preparing your estimate',
                description: 'A price range will follow as soon as it is ready.',
                status: 'active',
              },
              {
                title: 'Contractor reaches out',
                description: CONTRACTOR_FOLLOWUP,
                status: 'upcoming',
              },
            ]
      }
    />
  );
}

/** Default contractor post-submit steps for the apply form. */
export function ApplySuccessTimeline() {
  return (
    <PostSubmitTimeline
      steps={[
        {
          title: 'Application received',
          description: 'Your details are in our review queue.',
          status: 'done',
        },
        {
          title: 'Team review',
          description: 'We verify trade, service area, and credentials by hand.',
          status: 'active',
        },
        {
          title: 'Review outcome',
          description: "We'll follow up either way — typically within one business day.",
          status: 'upcoming',
        },
      ]}
    />
  );
}
