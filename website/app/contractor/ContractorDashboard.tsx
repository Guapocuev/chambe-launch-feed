import Link from 'next/link';
import { signOutContractor, type ContractorJobSummary, type ContractorSession } from './actions';

function firstName(fullName: string | null): string {
  if (!fullName?.trim()) return 'there';
  return fullName.trim().split(/\s+/)[0] ?? 'there';
}

function statusLabel(status: string): string {
  if (status === 'assigned') return 'Assigned';
  if (status === 'pending') return 'Pending';
  return status.replaceAll('_', ' ');
}

export function ContractorDashboard({
  contractor,
  jobs,
}: {
  contractor: ContractorSession;
  jobs: ContractorJobSummary[];
}) {
  return (
    <div className="mx-auto w-full max-w-md px-5 py-8">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-foreground/50">Your jobs</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground">
            Hey {firstName(contractor.full_name)}
          </h1>
        </div>
        <form action={signOutContractor}>
          <button
            type="submit"
            className="h-12 rounded-2xl border border-border px-4 text-base font-semibold text-foreground"
          >
            Log out
          </button>
        </form>
      </div>

      {!contractor.active && (
        <p className="mt-5 rounded-2xl border border-border bg-surface px-4 py-3 text-base text-foreground/75">
          Your application is in review. You can still open any job we assign you.
        </p>
      )}

      <Link
        href="/contractor/apprentices"
        className="mt-6 flex min-h-14 items-center justify-center rounded-2xl border border-border text-base font-semibold text-foreground"
      >
        Your apprentices
      </Link>

      <ul className="mt-8 space-y-3">
        {jobs.map((job) => (
          <li key={job.id}>
            <Link
              href={`/contractor/jobs/${job.id}`}
              className="block min-h-20 rounded-2xl border border-border bg-background px-4 py-4 active:bg-surface"
            >
              <p className="text-lg font-semibold leading-snug text-foreground">{job.job_description}</p>
              <p className="mt-1 text-sm text-foreground/60">
                {job.trade ?? 'Job'} · {statusLabel(job.job_status)}
              </p>
            </Link>
          </li>
        ))}
      </ul>

      {jobs.length === 0 && (
        <div className="mt-8 rounded-2xl border border-dashed border-border px-4 py-10 text-center">
          <p className="text-lg font-semibold text-foreground">No jobs yet</p>
          <p className="mt-2 text-base text-foreground/65">
            When we match you, it shows up here. We also text you.
          </p>
        </div>
      )}
    </div>
  );
}
