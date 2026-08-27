'use client';

import { useEffect, useState } from 'react';
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
  'w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-foreground/40 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand';

function money(value: number | null | undefined): string {
  if (value == null) return '—';
  return `$${value.toFixed(2)}`;
}

function hoursLabel(value: number | null | undefined): string {
  if (value == null) return '—';
  return `${value.toFixed(2)} h`;
}

export function JobTools({ contractorId, jobId }: { contractorId: string; jobId: string }) {
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
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contractorId, jobId]);

  async function run(action: () => Promise<{ ok: boolean; error?: string }>) {
    setBusy(true);
    setError(null);
    try {
      const result = await action();
      if (!result.ok) {
        setError(result.error ?? "That didn't work.");
        return;
      }
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  if (!bundle && !error) {
    return <p className="text-sm text-foreground/60">Loading job…</p>;
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
          {invoice.trade ?? 'Job'} · membership {membership_tier}
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-foreground">{invoice.job_description}</h1>
        <p className="mt-1 text-sm text-foreground/55">
          Hours, materials, and a simple invoice. No payments yet — membership tier is stored so we
          can gate this later.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Hours</h2>
        <p className="text-sm text-foreground/70">
          Open: {open_entry ? `clocked in ${new Date(open_entry.clocked_in_at).toLocaleString()}` : 'not clocked in'}
          {' · '}
          Total {hoursLabel(invoice.total_hours)}
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy || Boolean(open_entry)}
            onClick={() => void run(() => clockInJob(contractorId, jobId))}
            className="rounded-full bg-inverse px-5 py-2 text-sm font-semibold text-inverse-foreground disabled:opacity-50"
          >
            Clock in
          </button>
          <button
            type="button"
            disabled={busy || !open_entry}
            onClick={() => void run(() => clockOutJob(contractorId, jobId))}
            className="rounded-full border border-border px-5 py-2 text-sm font-semibold text-foreground disabled:opacity-50"
          >
            Clock out
          </button>
        </div>
        <div className="grid gap-3 sm:grid-cols-[8rem_1fr_auto]">
          <input
            type="number"
            min="0.25"
            step="0.25"
            placeholder="Hours"
            value={manualHours}
            onChange={(e) => setManualHours(e.target.value)}
            className={inputClass}
          />
          <input
            type="text"
            placeholder="Notes (optional)"
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
            className="rounded-full border border-border px-5 py-2 text-sm font-semibold text-foreground"
          >
            Log hours
          </button>
        </div>
        <ul className="divide-y divide-border rounded-xl border border-border">
          {time_entries.length === 0 && (
            <li className="px-4 py-3 text-sm text-foreground/50">No time logged yet.</li>
          )}
          {time_entries.map((entry) => (
            <li key={entry.id} className="flex justify-between gap-3 px-4 py-3 text-sm">
              <span>
                {new Date(entry.clocked_in_at).toLocaleString()}
                {entry.open ? ' — in progress' : ''}
                {entry.notes ? ` · ${entry.notes}` : ''}
              </span>
              <span className="tabular-nums text-foreground/70">{hoursLabel(entry.hours)}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Materials</h2>
        <div className="space-y-3 rounded-xl border border-border p-4">
          <input
            type="text"
            placeholder="What did you buy?"
            value={materialDesc}
            onChange={(e) => setMaterialDesc(e.target.value)}
            className={inputClass}
          />
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="Amount (CAD)"
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
            className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-inverse"
          >
            Add material
          </button>
        </div>
        <ul className="divide-y divide-border rounded-xl border border-border">
          {materials.length === 0 && (
            <li className="px-4 py-3 text-sm text-foreground/50">No materials logged yet.</li>
          )}
          {materials.map((row) => (
            <li key={row.id} className="flex justify-between gap-3 px-4 py-3 text-sm">
              <span>
                {row.description}
                {row.receipt_path ? ' · receipt attached' : ''}
              </span>
              <span className="tabular-nums text-foreground/70">{money(row.amount)}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-4 rounded-2xl border border-brand/30 bg-brand/5 p-6">
        <h2 className="text-lg font-semibold text-foreground">Invoice</h2>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-foreground/60">Quoted range</dt>
            <dd className="tabular-nums">
              {invoice.quoted_low != null && invoice.quoted_high != null
                ? `${money(invoice.quoted_low)} – ${money(invoice.quoted_high)}`
                : '—'}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-foreground/60">Hours</dt>
            <dd className="tabular-nums">
              {hoursLabel(invoice.total_hours)}
              {invoice.hourly_rate != null ? ` × ${money(invoice.hourly_rate)}` : ''}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-foreground/60">Labor</dt>
            <dd className="tabular-nums">{money(invoice.labor_total)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-foreground/60">Materials</dt>
            <dd className="tabular-nums">{money(invoice.materials_total)}</dd>
          </div>
          <div className="flex items-end justify-between gap-4">
            <dt className="text-foreground/60">Agreed price</dt>
            <dd className="flex gap-2">
              <input
                type="number"
                min="0"
                step="0.01"
                value={agreed}
                onChange={(e) => setAgreed(e.target.value)}
                className="w-28 rounded-lg border border-border bg-background px-3 py-1.5 text-right text-sm tabular-nums"
              />
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  void run(() =>
                    saveAgreedPrice(contractorId, jobId, agreed.trim() === '' ? null : parseFloat(agreed)),
                  )
                }
                className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold"
              >
                Save
              </button>
            </dd>
          </div>
        </dl>
        <p className="border-t border-border pt-4 text-2xl font-bold tabular-nums text-brand">
          {money(invoice.invoice_total)}{' '}
          <span className="text-base font-normal text-foreground/60">CAD</span>
        </p>
        <p className="text-xs text-foreground/50">
          Total is the agreed price when set; otherwise labor (hours × rate) plus materials. Not a
          payment request.
        </p>
      </section>
    </div>
  );
}
