const STEPS = ['Job', 'Location', 'Contact', 'Review'] as const;

export function FormStepProgress({ current }: { current: number }) {
  return (
    <nav aria-label="Form progress" className="mb-8">
      <ol className="flex items-center justify-between gap-2">
        {STEPS.map((label, i) => {
          const stepNum = i + 1;
          const isActive = stepNum === current;
          const isComplete = stepNum < current;

          return (
            <li key={label} className="flex flex-1 flex-col items-center gap-2">
              <div className="flex w-full items-center">
                {i > 0 && (
                  <div
                    className={`h-0.5 flex-1 ${isComplete || isActive ? 'bg-accent' : 'bg-border'}`}
                    aria-hidden="true"
                  />
                )}
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    isComplete
                      ? 'bg-accent text-brand'
                      : isActive
                        ? 'bg-brand text-background ring-2 ring-accent/40'
                        : 'border border-border bg-surface text-foreground/40'
                  }`}
                  aria-current={isActive ? 'step' : undefined}
                >
                  {isComplete ? '✓' : stepNum}
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 ${isComplete ? 'bg-accent' : 'bg-border'}`}
                    aria-hidden="true"
                  />
                )}
              </div>
              <span
                className={`text-xs font-medium ${isActive ? 'text-foreground' : 'text-foreground/50'}`}
              >
                {label}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
