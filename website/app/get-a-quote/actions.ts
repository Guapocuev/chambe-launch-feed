'use server';

import { DEMAND_ENGINE_API_KEY, DEMAND_ENGINE_URL } from '@/lib/config';

/**
 * Submits the job request form to the Demand Engine's
 * POST /webhooks/tally-intake — this is a direct replacement for the old
 * Tally form, so the payload keys below are not arbitrary: they match
 * exactly what demand-engine/src/services/tally-normalize.service.ts's
 * field() lookups check for (Chambe-mvp, same repo family). Don't rename
 * these keys without checking that file first.
 */

export interface QuoteFormState {
  status: 'idle' | 'success' | 'pending_retry' | 'error';
  message?: string;
  quote?: {
    low: number;
    high: number;
    priority: string;
    trade: string | null;
    offers_sent: number;
  };
}

export const initialQuoteFormState: QuoteFormState = { status: 'idle' };

export async function submitJobRequest(
  _prevState: QuoteFormState,
  formData: FormData,
): Promise<QuoteFormState> {
  const fullName = String(formData.get('Full Name') ?? '').trim();
  const phone = String(formData.get('Phone Number') ?? '').trim();
  const address = String(formData.get('Full Address') ?? '').trim();
  const description = String(formData.get('Detailed Job Description') ?? '').trim();
  // Set by QuoteForm.tsx's step-1 consent choice (or auto-set true for a
  // returning-client match, or false if nothing was ever set) — a hidden
  // field, not something the user types, so it's always present as a
  // literal "true"/"false" string rather than missing.
  const rememberClient = formData.get('rememberClient') === 'true';

  if (!fullName || !phone || !address || !description) {
    return { status: 'error', message: 'Please fill in your name, phone number, address, and a description of the job.' };
  }

  const payload = {
    'Full Name': fullName,
    'Phone Number': phone,
    'Email Address': String(formData.get('Email Address') ?? '').trim() || undefined,
    'Full Address': address,
    'Detailed Job Description': description,
    'Urgency': String(formData.get('Urgency') ?? '').trim() || undefined,
    'Is the issue affecting safety or causing damage?': String(formData.get('Safety') ?? '').trim() || undefined,
    'Job Length': String(formData.get('Job Length') ?? '').trim() || undefined,
    rememberClient,
    photo_paths: formData
      .getAll('photo_paths')
      .map((v) => String(v).trim())
      .filter((path) =>
        /^pending\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/[a-zA-Z0-9._-]+$/i.test(
          path,
        ),
      )
      .slice(0, 4),
  };

  try {
    const res = await fetch(`${DEMAND_ENGINE_URL}/webhooks/tally-intake`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Api-Key': DEMAND_ENGINE_API_KEY },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(20_000),
    });

    const body = await res.json().catch(() => ({}));

    if (res.status === 201) {
      return {
        status: 'success',
        quote: {
          low: body.quote?.low,
          high: body.quote?.high,
          priority: body.priority,
          trade: body.trade ?? null,
          offers_sent: body.offers_sent ?? 0,
        },
      };
    }

    if (res.status === 202) {
      return {
        status: 'pending_retry',
        message: "We've received your request and are finishing up your estimate — a Chambé team member will follow up shortly.",
      };
    }

    if (res.status === 400) {
      return { status: 'error', message: body.error ?? 'Please check your submission and try again.' };
    }

    return { status: 'error', message: 'Something went wrong on our end. Please try again in a moment.' };
  } catch {
    return {
      status: 'error',
      message: 'We could not reach the Chambé request service. Please try again shortly, or email us directly.',
    };
  }
}

export interface ReturningClientMatch {
  found: boolean;
  full_name?: string;
  email?: string;
  address?: string;
}

/**
 * Step 1 of /get-a-quote: called when the user submits their phone
 * number, before anything else is shown. Proxies Chambe-mvp's
 * POST /clients/lookup server-side — DEMAND_ENGINE_API_KEY never
 * reaches the browser this way, same reasoning as DEMAND_ENGINE_URL
 * (see lib/config.ts). A direct client-side fetch to that route would
 * need the key exposed via NEXT_PUBLIC_, which would let anyone read
 * it out of the page bundle and query it themselves.
 *
 * Deliberately fails soft: a lookup error (bad network, demand-engine
 * down, whatever) just means "treat this like a new client" — it must
 * never block someone from getting a quote.
 */
export async function checkReturningClient(phone: string): Promise<ReturningClientMatch> {
  const trimmed = phone.trim();
  if (!trimmed) return { found: false };

  try {
    const res = await fetch(`${DEMAND_ENGINE_URL}/clients/lookup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Api-Key': DEMAND_ENGINE_API_KEY },
      body: JSON.stringify({ phone: trimmed }),
      signal: AbortSignal.timeout(8_000),
    });

    if (!res.ok) return { found: false };

    const body = await res.json().catch(() => ({}));
    if (body?.found !== true) return { found: false };

    return {
      found: true,
      full_name: typeof body.full_name === 'string' ? body.full_name : undefined,
      email: typeof body.email === 'string' ? body.email : undefined,
      address: typeof body.address === 'string' ? body.address : undefined,
    };
  } catch {
    return { found: false };
  }
}
