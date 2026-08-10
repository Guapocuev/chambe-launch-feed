/**
 * Shown at the top of /privacy and /terms. Real policy text was never
 * provided for this rebuild (the source doc was referenced but its
 * contents weren't actually included), and this is not something to
 * fabricate — a Privacy Policy / Terms of Service page makes real legal
 * commitments. This banner exists so nobody mistakes the placeholder
 * structure below it for a page that's ready to publish.
 */
export function LegalDraftNotice() {
  return (
    <div className="mb-10 rounded-xl border border-accent/40 bg-accent/10 px-5 py-4 text-sm text-foreground">
      <p className="font-semibold text-accent-dark">🚧 Draft — not for publication</p>
      <p className="mt-1 text-foreground/70">
        This page is scaffolding, not real legal text. Section headings and placeholder notes below
        show what belongs here; every placeholder needs to be replaced with actual reviewed policy
        language — ideally by a lawyer — before this page goes live.
      </p>
    </div>
  );
}
