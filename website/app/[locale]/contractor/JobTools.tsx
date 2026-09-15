'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  addJobMaterial,
  clockInJob,
  clockOutJob,
  loadJobAdmin,
  logJobHours,
  saveAgreedPrice,
  type JobAdminBundle,
} from './actions';
import { ReceiptUpload } from './ReceiptUpload';

const inputClass =
  'h-14 w-full rounded-2xl border border-border bg-background px-4 text-base text-foreground placeholder:text-foreground/40 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand';

function money(value: number | null | undefined): string {
  if (value == null) return '—';
  return `$${value.toFixed(2)}`;
}

function hoursLabel(value: number | null | undefined): string {
  if (value == null) return '—';
  return `${value.toFixed(2)} h`;
}

export function JobTools({ contractorId, jobId }: { contractorId: string; jobId: string }) {
  const t = useTranslations('JobTools');
  const tAuth = useTranslations('Auth');
  const [bundle, setBundle] = useState<JobAdminBundle | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [manualHours, setManualHours] = useState('');
  const [manualNotes, setManualNotes] = useState('');
  const [materialDesc, setMaterialDesc] = useState('');
  const [materialAmount, setMaterialAmount] = useState('');
  const [receiptPath, setReceiptPath] = useState<string | null>(null);
  const [receiptKey, setReceiptKey] = useState(0);
  const [agreed, setAgreed] = useState('');

  async function refresh() {
    const result = await loadJobAdmin(contractorId, jobId);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError(null);
    setBundle(result.data);
    setAgreed(result.data.invoice.agreed_price != null ? String(result.data.invoice.agreed_price) : '');
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- load job tools when the route ids change
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contractorId, jobId]);

  async function run(action: () => Promise<{ ok: boolean; error?: string }>) {
    setBusy(true);
    setError(null);
    try {
      const result = await action();
      if (!result.ok) {
        setError(result.error ?? t('thatDidntWork'));
        return;
      }
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  if (!bundle && !error) {
    return <p className="text-sm text-foreground/60">{t('loading')}</p>;
  }

  if (!bundle) {
    return (
      <p className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
        {error}
      </p>
    );
  }

  const { invoice, time_entries, open_entry, materials, membership_tier } = bundle;

  return (
    <div className="space-y-10">
      {error && (
        <p className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      <header>
        <p className="text-xs font-semibold uppercase tracking-wide text-foreground/50">
          {t('membershipLine', { trade: invoice.trade ?? tAuth('jobFallback'), tier: membership_tier })}
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-foreground">{invoice.job_description}</h1>
        <p className="mt-1 text-sm text-foreground/55">
          {t('intro')}
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">{t('hours')}</h2>
        <p className="text-sm text-foreground/70">
          {t('openTotal', {
            open: open_entry
              ? t('clockedIn', { when: new Date(open_entry.clocked_in_at).toLocaleString() })
              : t('notClockedIn'),
            total: hoursLabel(invoice.total_hours),
          })}
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy || Boolean(open_entry)}
            onClick={() => void run(() => clockInJob(contractorId, jobId))}
            className="min-h-14 flex-1 rounded-2xl bg-inverse px-5 text-base font-semibold text-inverse-foreground disabled:opacity-50"
          >
            {t('clockIn')}
          </button>
          <button
            type="button"
            disabled={busy || !open_entry}
            onClick={() => void run(() => clockOutJob(contractorId, jobId))}
            className="min-h-14 flex-1 rounded-2xl border border-border px-5 text-base font-semibold text-foreground disabled:opacity-50"
          >
            {t('clockOut')}
          </button>
        </div>
        <div className="grid gap-3 sm:grid-cols-[8rem_1fr_auto]">
          <input
            type="number"
            min="0.25"
            step="0.25"
            placeholder={t('hoursPlaceholder')}
            value={manualHours}
            onChange={(e) => setManualHours(e.target.value)}
            className={inputClass}
          />
          <input
            type="text"
            placeholder={t('notesPlaceholder')}
            value={manualNotes}
            onChange={(e) => setManualNotes(e.target.value)}
            className={inputClass}
          />
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              void run(async () => {
                const hours = parseFloat(manualHours);
                const result = await logJobHours(contractorId, jobId, hours, manualNotes);
                if (result.ok) {
                  setManualHours('');
                  setManualNotes('');
                }
                return result;
              })
            }
            className="min-h-14 rounded-2xl border border-border px-5 text-base font-semibold text-foreground"
          >
            {t('logHours')}
          </button>
        </div>
        <ul className="divide-y divide-border rounded-xl border border-border">
          {time_entries.length === 0 && (
            <li className="px-4 py-3 text-sm text-foreground/50">{t('noTime')}</li>
          )}
          {time_entries.map((entry) => (
            <li key={entry.id} className="flex justify-between gap-3 px-4 py-3 text-sm">
              <span>
                {new Date(entry.clocked_in_at).toLocaleString()}
                {entry.open ? t('inProgress') : ''}
                {entry.notes ? ` · ${entry.notes}` : ''}
              </span>
              <span className="tabular-nums text-foreground/70">{hoursLabel(entry.hours)}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">{t('materials')}</h2>
        <div className="space-y-3 rounded-xl border border-border p-4">
          <input
            type="text"
            placeholder={t('boughtPlaceholder')}
            value={materialDesc}
            onChange={(e) => setMaterialDesc(e.target.value)}
            className={inputClass}
          />
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder={t('amountPlaceholder')}
            value={materialAmount}
            onChange={(e) => setMaterialAmount(e.target.value)}
            className={inputClass}
          />
          <ReceiptUpload key={receiptKey} onPath={setReceiptPath} />
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              void run(async () => {
                const amount = parseFloat(materialAmount);
                const result = await addJobMaterial(contractorId, jobId, {
                  description: materialDesc,
                  amount,
                  receipt_path: receiptPath ?? undefined,
                });
                if (result.ok) {
                  setMaterialDesc('');
                  setMaterialAmount('');
                  setReceiptPath(null);
                  setReceiptKey((n) => n + 1);
                }
                return result;
              })
            }
            className="min-h-14 w-full rounded-2xl bg-accent px-5 text-base font-semibold text-inverse"
          >
            {t('addMaterial')}
          </button>
        </div>
        <ul className="divide-y divide-border rounded-xl border border-border">
          {materials.length === 0 && (
            <li className="px-4 py-3 text-sm text-foreground/50">{t('noMaterials')}</li>
          )}
          {materials.map((row) => (
            <li key={row.id} className="flex justify-between gap-3 px-4 py-3 text-sm">
              <span>
                {row.description}
                {row.receipt_path ? t('receiptAttached') : ''}
              </span>
              <span className="tabular-nums text-foreground/70">{money(row.amount)}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-4 rounded-2xl border border-brand/30 bg-brand/5 p-6">
        <h2 className="text-lg font-semibold text-foreground">{t('invoice')}</h2>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-foreground/60">{t('quotedRange')}</dt>
            <dd className="tabular-nums">
              {invoice.quoted_low != null && invoice.quoted_high != null
                ? `${money(invoice.quoted_low)} – ${money(invoice.quoted_high)}`
                : '—'}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-foreground/60">{t('hours')}</dt>
            <dd className="tabular-nums">
              {hoursLabel(invoice.total_hours)}
              {invoice.hourly_rate != null ? ` × ${money(invoice.hourly_rate)}` : ''}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-foreground/60">{t('labor')}</dt>
            <dd className="tabular-nums">{money(invoice.labor_total)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-foreground/60">{t('materials')}</dt>
            <dd className="tabular-nums">{money(invoice.materials_total)}</dd>
          </div>
          <div className="flex items-end justify-between gap-4">
            <dt className="text-foreground/60">{t('agreedPrice')}</dt>
            <dd className="flex gap-2">
              <input
                type="number"
                min="0"
                step="0.01"
                value={agreed}
                onChange={(e) => setAgreed(e.target.value)}
                className="h-14 w-28 rounded-2xl border border-border bg-background px-3 text-right text-base tabular-nums"
              />
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  void run(() =>
                    saveAgreedPrice(contractorId, jobId, agreed.trim() === '' ? null : parseFloat(agreed)),
                  )
                }
                className="min-h-14 rounded-2xl border border-border px-4 text-base font-semibold"
              >
                {t('save')}
              </button>
            </dd>
          </div>
        </dl>
        <p className="border-t border-border pt-4 text-2xl font-bold tabular-nums text-brand">
          {money(invoice.invoice_total)}{' '}
          <span className="text-base font-normal text-foreground/60">CAD</span>
        </p>
        <p className="text-xs text-foreground/50">
          {t('totalNote')}
        </p>
      </section>
    </div>
  );
}
