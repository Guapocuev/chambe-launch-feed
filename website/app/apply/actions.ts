'use server';

import { DEMAND_ENGINE_URL } from '@/lib/config';

/**
 * Submits the contractor application form to the Demand Engine's
 * POST /contractors/apply (Chambe-mvp, contractor-application-endpoint
 * branch). Field names here match
 * demand-engine/src/services/contractor-application.service.ts's
 * ContractorApplicationInput exactly.
 */

export interface ApplyFormState {
  status: 'idle' | 'success' | 'error';
  message?: string;
}

export const initialApplyFormState: ApplyFormState = { status: 'idle' };

export async function submitContractorApplication(
  _prevState: ApplyFormState,
  formData: FormData,
): Promise<ApplyFormState> {
  const fullName = String(formData.get('full_name') ?? '').trim();
  const phone = String(formData.get('phone') ?? '').trim();
  const serviceArea = String(formData.get('service_area') ?? '').trim();
  const trades = formData.getAll('trade').map((t) => String(t));

  if (!fullName || !phone || !serviceArea || trades.length === 0) {
    return {
      status: 'error',
      message: 'Please fill in your name, phone number, at least one trade, and your service area.',
    };
  }

  const yearsExperienceRaw = String(formData.get('years_experience') ?? '').trim();

  const payload = {
    full_name: fullName,
    phone,
    email: String(formData.get('email') ?? '').trim() || undefined,
    trade: trades,
    service_area: serviceArea,
    years_experience: yearsExperienceRaw ? Number(yearsExperienceRaw) : undefined,
    notes: String(formData.get('notes') ?? '').trim() || undefined,
  };

  try {
    const res = await fetch(`${DEMAND_ENGINE_URL}/contractors/apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15_000),
    });

    if (res.status === 201) {
      return { status: 'success' };
    }

    const body = await res.json().catch(() => ({}));

    if (res.status === 400) {
      return { status: 'error', message: body.error ?? 'Please check your submission and try again.' };
    }

    return { status: 'error', message: 'Something went wrong on our end. Please try again in a moment.' };
  } catch {
    return {
      status: 'error',
      message: 'We could not reach the Chambé application service. Please try again shortly, or email us directly.',
    };
  }
}
