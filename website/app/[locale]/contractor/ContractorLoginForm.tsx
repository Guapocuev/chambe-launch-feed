'use client';

import { Link, useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { formatPhoneInput, isValidEmail, toE164 } from '@/lib/phone';
import { emailMagicLinkRedirectTo } from '@/lib/supabase/auth-redirect';
import { createBrowserSupabase } from '@/lib/supabase/client';
import { completeContractorLoginFromUrl } from '@/lib/supabase/complete-login';

const fieldClass =
  'h-14 w-full rounded-2xl border border-border bg-background px-4 text-lg text-foreground placeholder:text-foreground/35 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent';
const primaryBtn =
  'flex h-14 w-full items-center justify-center rounded-2xl bg-accent text-lg font-semibold text-inverse disabled:opacity-50';
const secondaryBtn =
  'flex h-14 w-full items-center justify-center rounded-2xl border border-border text-base font-semibold text-foreground disabled:opacity-50';

type Mode = 'phone' | 'code' | 'email';

export function ContractorLoginForm({
  homePath = '/contractor',
  callbackPath = '/contractor/auth/callback',
  verifyLabel = 'Open my jobs',
  applyHref = '/apply',
  applyLabel = 'Apply to join',
  emailHint = 'Enter the email on your contractor application.',
  altHref,
  altLabel,
  initialMode = 'phone',
}: {
  homePath?: string;
  callbackPath?: string;
  verifyLabel?: string;
  applyHref?: string;
  applyLabel?: string;
  emailHint?: string;
  altHref?: string;
  altLabel?: string;
  initialMode?: Mode;
} = {}) {
  const router = useRouter();
  const t = useTranslations('Auth');
  const [mode, setMode] = useState<Mode>(initialMode);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!window.location.hash.includes('access_token') && !new URLSearchParams(window.location.search).get('code')) {
      return;
    }
    void completeContractorLoginFromUrl().then((result) => {
      if (result.ok) {
        router.replace(homePath);
        router.refresh();
      }
    });
  }, [router, homePath]);

  async function sendPhoneCode() {
    const e164 = toE164(phone);
    if (!e164) {
      setError(t('enterPhone'));
      return;
    }
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const supabase = createBrowserSupabase();
      const { error: otpError } = await supabase.auth.signInWithOtp({
        phone: e164,
        options: { shouldCreateUser: true },
      });
      // SMS OTP needs a phone provider in Supabase Auth (Twilio, etc.).
      // Email magic link works without that — enable SMS as a follow-up.
      if (otpError) {
        setError(otpError.message);
        return;
      }
      setMode('code');
      setMessage(t('textedCode', { phone: e164 }));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('sendTextFail'));
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode(rawCode: string = code) {
    const e164 = toE164(phone);
    const token = rawCode.replace(/\D/g, '');
    if (!e164 || token.length < 6) {
      setError(t('enterCode'));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const supabase = createBrowserSupabase();
      const { error: verifyError } = await supabase.auth.verifyOtp({
        phone: e164,
        token,
        type: 'sms',
      });
      if (verifyError) {
        setError(verifyError.message);
        return;
      }
      router.replace(homePath);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('codeFail'));
    } finally {
      setBusy(false);
    }
  }

  async function sendMagicLink() {
    if (!email.trim() || !isValidEmail(email) || !email.includes('@')) {
      setError(emailHint);
      return;
    }
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const supabase = createBrowserSupabase();
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: emailMagicLinkRedirectTo(callbackPath),
          shouldCreateUser: true,
        },
      });
      if (otpError) {
        setError(otpError.message);
        return;
      }
      setMessage(t('checkEmail', { email: email.trim() }));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('sendEmailFail'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      {error && (
        <p className="rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-base text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}
      {message && (
        <p className="rounded-2xl border border-brand/20 bg-brand/5 px-4 py-3 text-base text-foreground">
          {message}
        </p>
      )}

      {mode === 'phone' && (
        <>
          <label className="block text-base font-medium text-foreground">
            {t('phoneNumber')}
            <input
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              autoFocus
              value={phone}
              onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
              placeholder="(647) 555-0199"
              className={`mt-2 ${fieldClass}`}
            />
          </label>
          <button type="button" disabled={busy} onClick={() => void sendPhoneCode()} className={primaryBtn}>
            {busy ? t('sending') : t('textCode')}
          </button>
          <button type="button" disabled={busy} onClick={() => { setMode('email'); setError(null); setMessage(null); }} className={secondaryBtn}>
            {t('useEmail')}
          </button>
        </>
      )}

      {mode === 'code' && (
        <>
          <label className="block text-base font-medium text-foreground">
            {t('codeFromText')}
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]*"
              autoFocus
              value={code}
              onChange={(e) => {
                const next = e.target.value.replace(/\D/g, '').slice(0, 8);
                setCode(next);
                if (next.length >= 6 && !busy) void verifyCode(next);
              }}
              placeholder="123456"
              className={`mt-2 tracking-[0.4em] ${fieldClass} text-center text-2xl`}
            />
          </label>
          <button type="button" disabled={busy} onClick={() => void verifyCode()} className={primaryBtn}>
            {busy ? t('checking') : verifyLabel}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => { setMode('phone'); setCode(''); setError(null); setMessage(null); }}
            className={secondaryBtn}
          >
            {t('differentNumber')}
          </button>
        </>
      )}

      {mode === 'email' && (
        <>
          <label className="block text-base font-medium text-foreground">
            {t('email')}
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={`mt-2 ${fieldClass}`}
            />
          </label>
          <button type="button" disabled={busy} onClick={() => void sendMagicLink()} className={primaryBtn}>
            {busy ? t('sending') : t('emailLink')}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => { setMode('phone'); setError(null); setMessage(null); }}
            className={secondaryBtn}
          >
            {t('usePhone')}
          </button>
        </>
      )}

      {(applyHref || altHref) && (
        <p className="text-center text-sm text-foreground/55">
          {applyHref && (
            <>
              {t('newHere')}{' '}
              <Link href={applyHref} className="font-semibold text-foreground underline-offset-2 hover:underline">
                {applyLabel}
              </Link>
            </>
          )}
          {applyHref && altHref && altLabel ? ' · ' : null}
          {altHref && altLabel ? (
            <Link href={altHref} className="font-semibold text-foreground underline-offset-2 hover:underline">
              {altLabel}
            </Link>
          ) : null}
        </p>
      )}
    </div>
  );
}
