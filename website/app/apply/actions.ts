'use server';

import { DEMAND_ENGINE_API_KEY, DEMAND_ENGINE_URL } from '@/lib/config';
import { CONTACT_EMAIL } from '@/lib/site';

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
  contact?: {
    phone: string;
    email?: string;
  };
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
  const notes = buildVettingNotes(formData);
  const email = String(formData.get('email') ?? '').trim() || undefined;

  const payload = {
    full_name: fullName,
    phone,
    email,
    trade: trades,
    service_area: serviceArea,
    years_experience: yearsExperienceRaw ? Number(yearsExperienceRaw) : undefined,
    notes,
  };

  try {
    const res = await fetch(`${DEMAND_ENGINE_URL}/contractors/apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Api-Key': DEMAND_ENGINE_API_KEY },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15_000),
    });

    if (res.status === 201) {
      return {
        status: 'success',
        contact: { phone, email },
      };
    }

    const body = await res.json().catch(() => ({}));

    if (res.status === 400) {
      return { status: 'error', message: body.error ?? 'Please check your submission and try again.' };
    }

    return { status: 'error', message: 'Something went wrong on our end. Please try again in a moment.' };
  } catch {
    return {
      status: 'error',
      message: `We could not reach the Chambé application service. Please try again shortly, or email ${CONTACT_EMAIL}.`,
    };
  }
}

function yesNo(value: string): string {
  if (value === 'yes') return 'Yes';
  if (value === 'no') return 'No';
  return 'Not specified';
}

/** Licence / insurance / WSIB are not first-class API fields — fold into notes. */
function buildVettingNotes(formData: FormData): string | undefined {
  const licensed = String(formData.get('licensed') ?? '');
  const licenceNumber = String(formData.get('licence_number') ?? '').trim();
  const insured = String(formData.get('insured') ?? '');
  const wsib = String(formData.get('wsib') ?? '');
  const wsibNumber = String(formData.get('wsib_number') ?? '').trim();

  const licenceLine =
    licensed === 'yes' && licenceNumber
      ? `Licence: Yes (${licenceNumber})`
      : `Licence: ${yesNo(licensed)}`;
  const wsibLine =
    wsib === 'yes' && wsibNumber ? `WSIB: Yes (${wsibNumber})` : `WSIB: ${yesNo(wsib)}`;

  const notes = [licenceLine, `Insurance: ${yesNo(insured)}`, wsibLine].join('\n');
  return notes.trim() ? notes : undefined;
}
