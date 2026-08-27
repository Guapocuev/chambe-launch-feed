'use client';

import { useFormStatus } from 'react-dom';

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
      className="w-full rounded-full bg-accent px-6 py-3 text-sm font-semibold text-inverse transition hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
    >
      {pending ? 'Submitting…' : children}
    </button>
  );
}
