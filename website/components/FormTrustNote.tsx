interface FormTrustNoteProps {
  variant?: 'homeowner' | 'contractor';
}

export function FormTrustNote({ variant = 'homeowner' }: FormTrustNoteProps) {
  const lines =
    variant === 'contractor'
      ? [
          'Your application is reviewed by our team — not shared with other contractors.',
          'We only onboard licensed, insured trades in the Toronto & GTA.',
          'Typical follow-up within one business day.',
        ]
      : [
          'Your contact info stays with Chambé — never sold to third parties.',
          'Every contractor is background-checked, licensed, and insured.',
          'Typical contractor response: within one hour during business hours.',
        ];

  return (
    <div
      className="rounded-lg border border-border bg-surface px-4 py-3 text-xs leading-relaxed text-foreground/65"
      aria-label="Privacy and service guarantees"
    >
      <ul className="space-y-1.5">
        {lines.map((line) => (
          <li key={line} className="flex gap-2">
            <span className="mt-0.5 shrink-0 text-accent" aria-hidden="true">
              ✓
            </span>
            <span>{line}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
