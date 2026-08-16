'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { formatPhoneInput, isValidEmail, isValidName, isValidPhone } from '@/lib/phone';
import { CONTACT_EMAIL } from '@/lib/site';

const inputBase =
  'w-full rounded-lg border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-1';

function fieldClass(hasError: boolean) {
  return `${inputBase} ${
    hasError
      ? 'border-red-400 focus:border-red-400 focus:ring-red-400/30'
      : 'border-border focus:border-accent focus:ring-accent'
  }`;
}

interface PhoneFieldProps {
  id: string;
  name: string;
  required?: boolean;
  placeholder?: string;
}

export function PhoneField({
  id,
  name,
  required = true,
  placeholder = '(647) 555-0199',
}: PhoneFieldProps) {
  const [value, setValue] = useState('');
  const [touched, setTouched] = useState(false);
  const error = touched && !isValidPhone(value);

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-foreground">
        Phone number
      </label>
      <input
        id={id}
        name={name}
        type="tel"
        required={required}
        autoComplete="tel"
        inputMode="tel"
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(formatPhoneInput(e.target.value))}
        onBlur={() => setTouched(true)}
        aria-invalid={error}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`mt-1.5 ${fieldClass(error)}`}
      />
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-xs text-red-600" role="alert">
          Enter a valid 10-digit phone number.
        </p>
      )}
    </div>
  );
}

interface ValidatedTextFieldProps {
  id: string;
  name: string;
  label: string;
  type?: 'text' | 'email';
  required?: boolean;
  autoComplete?: string;
  placeholder?: string;
  validate?: (value: string) => boolean;
  errorMessage?: string;
}

export function ValidatedTextField({
  id,
  name,
  label,
  type = 'text',
  required = false,
  autoComplete,
  placeholder,
  validate,
  errorMessage = 'Please check this field.',
}: ValidatedTextFieldProps) {
  const [value, setValue] = useState('');
  const [touched, setTouched] = useState(false);
  const check = validate ?? (required ? (v: string) => v.trim().length > 0 : () => true);
  const error = touched && !check(value);

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-foreground">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => setTouched(true)}
        aria-invalid={error}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`mt-1.5 ${fieldClass(error)}`}
      />
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-xs text-red-600" role="alert">
          {errorMessage}
        </p>
      )}
    </div>
  );
}

export { isValidEmail, isValidName, isValidPhone };

const errorBannerClass =
  'rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300';

/** Server/network error banner. Turns hello@chambe.ca into a mailto link. */
export function FormErrorBanner({ message }: { message: string }) {
  const escaped = CONTACT_EMAIL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = message.split(new RegExp(`(${escaped})`));

  return (
    <div className={errorBannerClass} role="alert">
      {parts.map((part, i) =>
        part === CONTACT_EMAIL ? (
          <a key={i} href={`mailto:${CONTACT_EMAIL}`} className="underline underline-offset-2">
            {CONTACT_EMAIL}
          </a>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </div>
  );
}

/** Lazy-mount children when the wrapper scrolls into view. */
export function LazyWhenVisible({
  children,
  fallback,
  rootMargin = '200px',
}: {
  children: ReactNode;
  fallback: ReactNode;
  rootMargin?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin]);

  return <div ref={ref}>{visible ? children : fallback}</div>;
}
