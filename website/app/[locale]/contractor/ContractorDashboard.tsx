'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { signOutContractor, type ContractorJobSummary, type ContractorSession } from './actions';

function firstName(fullName: string | null, fallback: string): string {
  if (!fullName?.trim()) return fallback;
  return fullName.trim().split(/\s+/)[0] ?? fallback;
}

export function ContractorDashboard({
  contractor,
  jobs,
}: {
  contractor: ContractorSession;
  jobs: ContractorJobSummary[];
}) {
  const t = useTranslations('Auth');
  const tGallery = useTranslations('Gallery');

  function statusLabel(status: string): string {
    if (status === 'assigned') return t('assigned');
    if (status === 'pending') return t('pending');
    return status.replaceAll('_', ' ');
  }

  function tradeCopy(trade: string | null): string {
    if (trade === 'electrical' || trade === 'plumbing' || trade === 'carpentry') {
      return tGallery(trade);
    }
    return trade ?? t('jobFallback');
  }

  return (
    <div className="mx-auto w-full max-w-md px-5 py-8">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-foreground/50">{t('jobsTitle')}</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground">
            {t('hey', { name: firstName(contractor.full_name, t('there')) })}
          </h1>
        </div>
        <form action={signOutContractor}>
          <button
            type="submit"
            className="h-12 rounded-2xl border border-border px-4 text-base font-semibold text-foreground"
          >
            {t('logOut')}
          </button>
        </form>
      </div>

      {!contractor.active && (
        <p className="mt-5 rounded-2xl border border-border bg-surface px-4 py-3 text-base text-foreground/75">
          {t('inReview')}
        </p>
      )}

      <Link
        href="/contractor/apprentices"
        className="mt-6 flex min-h-14 items-center justify-center rounded-2xl border border-border text-base font-semibold text-foreground"
      >
        {t('apprenticesLink')}
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
                {tradeCopy(job.trade)} · {statusLabel(job.job_status)}
              </p>
            </Link>
          </li>
        ))}
      </ul>

      {jobs.length === 0 && (
        <div className="mt-8 rounded-2xl border border-dashed border-border px-4 py-10 text-center">
          <p className="text-lg font-semibold text-foreground">{t('noJobs')}</p>
          <p className="mt-2 text-base text-foreground/65">{t('noJobsBody')}</p>
        </div>
      )}
    </div>
  );
}
