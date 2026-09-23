'use client';

import { useFormStatus } from 'react-dom';
import { MARKETING_CTA } from '@/lib/marketing-cta';

export function SubmitButton({
  children,
  disabled = false,
}: {
  children: React.ReactNode;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className={`w-full sm:w-auto ${MARKETING_CTA} disabled:cursor-not-allowed disabled:opacity-60`}
    >
      {pending ? 'Submitting…' : children}
    </button>
  );
}
