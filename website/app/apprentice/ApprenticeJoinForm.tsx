'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { formatPhoneInput } from '@/lib/phone';
import { joinApprenticeAction } from './actions';

const fieldClass =
  'h-14 w-full rounded-2xl border border-border bg-background px-4 text-lg text-foreground placeholder:text-foreground/35 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent';
const primaryBtn =
  'flex h-14 w-full items-center justify-center rounded-2xl bg-accent text-lg font-semibold text-inverse disabled:opacity-50';

const TRADES = [
  { id: 'electrical', label: 'Electrical' },
  { id: 'plumbing', label: 'Plumbing' },
  { id: 'carpentry', label: 'Carpentry' },
] as const;

export function ApprenticeJoinForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phone, setPhone] = useState('');
  const [supervisorPhone, setSupervisorPhone] = useState('');

  async function onSubmit(formData: FormData) {
    setBusy(true);
    setError(null);
    formData.set('phone', phone);
    formData.set('supervisor_phone', supervisorPhone);
    const result = await joinApprenticeAction(formData);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.replace('/apprentice');
    router.refresh();
  }

  return (
    <div className="mx-auto w-full max-w-md px-5 py-10">
      <p className="text-sm font-semibold uppercase tracking-wide text-foreground/50">Apprentices</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">Your trade</h1>
      <p className="mt-3 text-base leading-relaxed text-foreground/70">
        One screen. Then you log hours. Your supervisor can see them if you add their number.
      </p>
      {error && (
        <p className="mt-5 rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-base text-red-800">{error}</p>
      )}
      <form action={(formData) => void onSubmit(formData)} className="mt-8 space-y-4">
        <label className="block text-base font-medium">
          Your name
          <input name="full_name" required minLength={2} autoComplete="name" className={`mt-2 ${fieldClass}`} />
        </label>
        <label className="block text-base font-medium">
          Your phone
          <input
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            required
            value={phone}
            onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
            placeholder="(647) 555-0199"
            className={`mt-2 ${fieldClass}`}
          />
        </label>
        <fieldset>
          <legend className="text-base font-medium">Trade</legend>
          <div className="mt-2 grid gap-2">
            {TRADES.map((trade) => (
              <label key={trade.id} className="flex min-h-14 items-center gap-3 rounded-2xl border border-border px-4 text-base">
                <input type="radio" name="trade" value={trade.id} required className="h-5 w-5 accent-black" />
                {trade.label}
              </label>
            ))}
          </div>
        </fieldset>
        <label className="block text-base font-medium">
          Supervisor phone (optional)
          <input
            type="tel"
            inputMode="tel"
            value={supervisorPhone}
            onChange={(e) => setSupervisorPhone(formatPhoneInput(e.target.value))}
            placeholder="(647) 555-0100"
            className={`mt-2 ${fieldClass}`}
          />
        </label>
        <button type="submit" disabled={busy} className={primaryBtn}>
          {busy ? 'Saving…' : 'Start tracking hours'}
        </button>
      </form>
    </div>
  );
}
