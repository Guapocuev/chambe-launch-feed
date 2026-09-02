'use client';

import { HONEYPOT_FIELD } from '@/lib/honeypot';

/**
 * Off-screen field real users never fill. Naive bots do. Must not use
 * display:none (some bots skip those) or name="website" (password managers).
 */
export function HoneypotField() {
  return (
    <div className="chambe-hp" aria-hidden="true">
      <label htmlFor={HONEYPOT_FIELD}>Company website</label>
      <input
        id={HONEYPOT_FIELD}
        name={HONEYPOT_FIELD}
        type="text"
        tabIndex={-1}
        autoComplete="off"
      />
    </div>
  );
}
