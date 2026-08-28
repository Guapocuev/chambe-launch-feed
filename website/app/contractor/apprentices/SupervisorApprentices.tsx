'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { formatPhoneInput } from '@/lib/phone';
import { inviteApprenticeAction, type ApprenticeHourEntry, type ApprenticeProfile, type ApprenticeQuestion, type HourProgress } from '@/app/apprentice/actions';

const fieldClass =
  'h-14 w-full rounded-2xl border border-border bg-background px-4 text-lg text-foreground placeholder:text-foreground/35 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent';

function tradeLabel(trade: string): string {
  if (trade === 'electrical') return 'Electrical';
  if (trade === 'plumbing') return 'Plumbing';
  if (trade === 'carpentry') return 'Carpentry';
  return trade;
}

export function SupervisorApprentices({
  apprentices,
  pending,
}: {
  apprentices: Array<{
    apprentice: ApprenticeProfile;
    progress: HourProgress;
    hours: ApprenticeHourEntry[];
    questions: ApprenticeQuestion[];
  }>;
  pending: Array<{ id: string; full_name: string; phone: string; trade: string }>;
}) {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function invite(formData: FormData) {
    setBusy(true);
    setError(null);
    formData.set('phone', phone);
    const result = await inviteApprenticeAction(formData);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setPhone('');
    router.refresh();
  }

  return (
    <div className="mx-auto w-full max-w-md px-5 py-8">
      <p className="text-sm font-semibold uppercase tracking-wide text-foreground/50">Supervisor</p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground">Apprentices</h1>
      <p className="mt-3 text-base text-foreground/70">Hours and questions in one place. Separate from job-site invoice hours.</p>

      {error && (
        <p className="mt-5 rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-base text-red-800">{error}</p>
      )}

      <form action={(formData) => void invite(formData)} className="mt-8 space-y-3 rounded-2xl border border-border p-4">
        <p className="text-base font-semibold">Add an apprentice</p>
        <input name="full_name" required minLength={2} placeholder="Name" className={fieldClass} />
        <input
          type="tel"
          inputMode="tel"
          required
          value={phone}
          onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
          placeholder="Phone"
          className={fieldClass}
        />
        <select name="trade" required className={fieldClass}>
          <option value="electrical">Electrical</option>
          <option value="plumbing">Plumbing</option>
          <option value="carpentry">Carpentry</option>
        </select>
        <button
          type="submit"
          disabled={busy}
          className="flex h-14 w-full items-center justify-center rounded-2xl bg-accent text-lg font-semibold text-inverse disabled:opacity-50"
        >
          {busy ? 'Adding…' : 'Add'}
        </button>
        <p className="text-sm text-foreground/55">They log in with that phone and land on their hours.</p>
      </form>

      {pending.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold">Waiting to log in</h2>
          <ul className="mt-3 space-y-2">
            {pending.map((row) => (
              <li key={row.id} className="rounded-2xl border border-dashed border-border px-4 py-3 text-base">
                {row.full_name} · {tradeLabel(row.trade)}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-8 space-y-6">
        {apprentices.length === 0 && pending.length === 0 && (
          <p className="rounded-2xl border border-dashed border-border px-4 py-10 text-center text-base text-foreground/65">
            No apprentices yet. Add one above.
          </p>
        )}
        {apprentices.map((row) => (
          <article key={row.apprentice.id} className="rounded-2xl border border-border px-4 py-5">
            <h2 className="text-xl font-bold text-foreground">{row.apprentice.full_name ?? 'Apprentice'}</h2>
            <p className="mt-1 text-base text-foreground/60">
              {tradeLabel(row.apprentice.trade)} · {row.progress.total_hours.toFixed(1)} h · Level {row.progress.current_level}
            </p>
            <div className="mt-3 h-3 overflow-hidden rounded-full bg-surface">
              <div
                className="h-full rounded-full bg-accent"
                style={{
                  width: `${row.progress.target_total > 0 ? Math.min(100, (row.progress.total_hours / row.progress.target_total) * 100) : 0}%`,
                }}
              />
            </div>

            <h3 className="mt-5 text-sm font-semibold uppercase tracking-wide text-foreground/50">Hours</h3>
            <ul className="mt-2 divide-y divide-border">
              {row.hours.length === 0 && <li className="py-2 text-base text-foreground/55">None yet</li>}
              {row.hours.slice(0, 8).map((entry) => (
                <li key={entry.id} className="flex justify-between py-2 text-base">
                  <span>
                    {entry.worked_on}
                    {entry.notes ? ` · ${entry.notes}` : ''}
                  </span>
                  <span className="tabular-nums">{entry.hours.toFixed(2)} h</span>
                </li>
              ))}
            </ul>

            <h3 className="mt-5 text-sm font-semibold uppercase tracking-wide text-foreground/50">Questions</h3>
            <ul className="mt-2 space-y-3">
              {row.questions.length === 0 && <li className="text-base text-foreground/55">None yet</li>}
              {row.questions.slice(0, 6).map((item) => (
                <li key={item.id}>
                  <p className="text-base font-semibold">{item.question}</p>
                  <p className="mt-1 text-base leading-relaxed text-foreground/75">{item.answer}</p>
                  <p className="mt-1 text-xs text-foreground/45">{new Date(item.created_at).toLocaleString()}</p>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>
    </div>
  );
}
