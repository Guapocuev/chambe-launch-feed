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
