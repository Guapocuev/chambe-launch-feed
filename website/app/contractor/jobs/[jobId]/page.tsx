import type { Metadata } from 'next';
import { JobTools } from '../../JobTools';

export const metadata: Metadata = {
  title: 'Job invoice',
  robots: { index: false, follow: false },
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function ContractorJobPage({
  params,
  searchParams,
}: {
  params: Promise<{ jobId: string }>;
  searchParams: Promise<{ contractor?: string }>;
}) {
  const { jobId } = await params;
  const { contractor } = await searchParams;

  if (!UUID_RE.test(jobId) || !contractor || !UUID_RE.test(contractor)) {
    return (
      <div className="mx-auto max-w-lg px-6 py-20">
        <h1 className="text-xl font-semibold text-foreground">Missing IDs</h1>
        <p className="mt-2 text-sm text-foreground/70">
          Open this page from Job tools with a contractor ID and job ID.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <JobTools contractorId={contractor} jobId={jobId} />
    </div>
  );
}
