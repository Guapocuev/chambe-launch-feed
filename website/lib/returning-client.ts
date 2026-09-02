import { DEMAND_ENGINE_URL } from '@/lib/config';
import { demandEngineHeaders } from '@/lib/engine-request';
import { allowVisitor } from '@/lib/rate-limit';

export interface ReturningClientMatch {
  found: true;
  full_name: string | null;
  email: string | null;
  address: string | null;
  phone: string;
}

export type ReturningClientLookup =
  | ReturningClientMatch
  | { found: false }
  | { found: false; error: string };

/**
 * Server-only lookup. Call this before rendering /get-a-quote to pre-fill
 * a returning homeowner. Hits Demand Engine POST /clients/lookup — exact
 * E.164 phone match, never a list of other clients.
 */
export async function lookupReturningClient(phone: string): Promise<ReturningClientLookup> {
  if (!(await allowVisitor('lookup', 20))) {
    return { found: false, error: 'Lookup unavailable' };
  }

  try {
    const res = await fetch(`${DEMAND_ENGINE_URL}/clients/lookup`, {
      method: 'POST',
      headers: await demandEngineHeaders(),
      body: JSON.stringify({ phone }),
      signal: AbortSignal.timeout(8_000),
    });

    const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;

    if (res.status === 400) {
      return { found: false, error: typeof body.error === 'string' ? body.error : 'Invalid phone' };
    }

    if (!res.ok) {
      return { found: false, error: 'Lookup unavailable' };
    }

    if (body.found === true) {
      return {
        found: true,
        full_name: typeof body.full_name === 'string' ? body.full_name : null,
        email: typeof body.email === 'string' ? body.email : null,
        address: typeof body.address === 'string' ? body.address : null,
        phone: typeof body.phone === 'string' ? body.phone : phone,
      };
    }

    return { found: false };
  } catch {
    return { found: false, error: 'Lookup unavailable' };
  }
}
