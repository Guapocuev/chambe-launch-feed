import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Job tools',
  description: 'Track hours and materials, then view a simple invoice for a Chambé job.',
  robots: { index: false, follow: false },
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const inputClass =
  'w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-foreground/40 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand';

export default function ContractorToolsEntryPage() {
  async function openJob(formData: FormData) {
    'use server';
    const contractorId = String(formData.get('contractorId') ?? '').trim();
    const jobId = String(formData.get('jobId') ?? '').trim();
    if (!UUID_RE.test(contractorId) || !UUID_RE.test(jobId)) {
      return;
    }
    redirect(`/contractor/jobs/${jobId}?contractor=${contractorId}`);
  }

  return (
    <div className="mx-auto max-w-lg px-6 py-20">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Job tools</h1>
      <p className="mt-3 text-sm text-foreground/70">
        Clock time, log materials, and view a simple invoice. This is a first cut — no login or
        payments yet. Use the contractor and job IDs from dispatch.
      </p>
      <form action={openJob} className="mt-8 space-y-4">
        <label className="block text-sm font-medium text-foreground">
          Contractor ID
          <input name="contractorId" className={`mt-1.5 ${inputClass}`} placeholder="uuid" required />
        </label>
        <label className="block text-sm font-medium text-foreground">
          Job ID
          <input name="jobId" className={`mt-1.5 ${inputClass}`} placeholder="uuid" required />
        </label>
        <button
          type="submit"
          className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-inverse"
        >
          Open job
        </button>
      </form>
    </div>
  );
}
