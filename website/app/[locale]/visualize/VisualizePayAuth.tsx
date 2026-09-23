'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { MARKETING_CTA } from '@/lib/marketing-cta';
import { isValidEmail } from '@/lib/phone';
import { emailMagicLinkRedirectTo } from '@/lib/supabase/auth-redirect';
import { createBrowserSupabase } from '@/lib/supabase/client';

export function VisualizePayAuth({ priceLabel, sessionId }: { priceLabel: string; sessionId: string }) {
  const t = useTranslations('Visualize');
  const tAuth = useTranslations('Auth');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function sendMagicLink() {
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes('@') || !isValidEmail(trimmed)) {
      setError(tAuth('emailHintVisualize'));
      return;
    }
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const supabase = createBrowserSupabase();
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: trimmed,
        options: {
          emailRedirectTo: emailMagicLinkRedirectTo(
            `/visualize/auth/callback?resume=${encodeURIComponent(sessionId)}`,
          ),
          shouldCreateUser: true,
        },
      });
      if (otpError) {
        setError(otpError.message);
        return;
      }
      setMessage(t('payAuthSent', { email: trimmed }));
    } catch (err) {
      setError(err instanceof Error ? err.message : tAuth('sendEmailFail'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3 rounded-xl border border-border bg-surface px-4 py-4">
      <p className="text-sm font-semibold text-foreground">{t('payAuthTitle', { price: priceLabel })}</p>
      <p className="text-sm text-foreground/70">{t('payAuthBody')}</p>
      {error && (
        <p className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}
      {message && (
        <p className="rounded-lg border border-brand/20 bg-brand/5 px-4 py-3 text-sm text-foreground">{message}</p>
      )}
      <label className="block text-sm font-medium text-foreground">
        {tAuth('email')}
        <input
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="mt-2 h-12 w-full rounded-2xl border border-border bg-background px-4 text-base text-foreground placeholder:text-foreground/35 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </label>
      <button
        type="button"
        disabled={busy}
        onClick={() => void sendMagicLink()}
        className={`${MARKETING_CTA} w-full sm:w-auto disabled:opacity-50`}
      >
        {busy ? tAuth('sending') : tAuth('emailLink')}
      </button>
    </div>
  );
}
