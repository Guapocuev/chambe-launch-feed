export function QuoteConfidence({
  score,
  explanations,
  followUps,
}: {
  score: number;
  explanations: string[];
  followUps: string[];
}) {
  const shown = Math.min(99, Math.max(0, score));

  return (
    <div className="mt-4 rounded-xl border border-border bg-background px-4 py-4">
      <p className="text-sm font-medium text-foreground">
        Estimate confidence{' '}
        <span className="tabular-nums">
          {shown}
          <span className="text-foreground/50">/100</span>
        </span>
      </p>
      {explanations.length > 0 && (
        <ul className="mt-2 space-y-1 text-sm text-foreground/70">
          {explanations.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      )}
      {shown < 70 && followUps.length > 0 && (
        <div className="mt-3">
          <p className="text-sm font-medium text-foreground">A tighter estimate would need:</p>
          <ul className="mt-1.5 list-disc space-y-1 pl-5 text-sm text-foreground/70">
            {followUps.map((prompt) => (
              <li key={prompt}>{prompt}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
