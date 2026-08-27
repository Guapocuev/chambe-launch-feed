'use server';

import { DEMAND_ENGINE_API_KEY, DEMAND_ENGINE_URL } from '@/lib/config';

export type MembershipTier = 'free' | 'pro' | 'premium';

export interface TimeEntry {
  id: string;
  clocked_in_at: string;
  clocked_out_at: string | null;
  hours: number | null;
  notes: string | null;
  open: boolean;
}

export interface MaterialCost {
  id: string;
  description: string;
  amount: number;
  receipt_path: string | null;
  created_at: string;
}

export interface JobInvoice {
  job_id: string;
  job_description: string;
  trade: string | null;
  membership_tier: MembershipTier;
  quoted_low: number | null;
  quoted_high: number | null;
  agreed_price: number | null;
  hourly_rate: number | null;
  total_hours: number;
  labor_total: number | null;
  materials_total: number;
  invoice_total: number | null;
}

export interface JobAdminBundle {
  contractor_id: string;
  membership_tier: MembershipTier;
  invoice: JobInvoice;
  time_entries: TimeEntry[];
  open_entry: TimeEntry | null;
  materials: MaterialCost[];
}

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

async function callEngine<T>(path: string, init?: RequestInit): Promise<ActionResult<T>> {
  try {
    const res = await fetch(`${DEMAND_ENGINE_URL}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': DEMAND_ENGINE_API_KEY,
        ...(init?.headers ?? {}),
      },
      signal: AbortSignal.timeout(12_000),
    });
    const body = (await res.json().catch(() => ({}))) as T & { error?: string };
    if (!res.ok) {
      return { ok: false, error: typeof body.error === 'string' ? body.error : 'Request failed.' };
    }
    return { ok: true, data: body as T };
  } catch {
    return { ok: false, error: 'Could not reach the job tools service. Try again in a moment.' };
  }
}

export async function loadJobAdmin(contractorId: string, jobId: string): Promise<ActionResult<JobAdminBundle>> {
  return callEngine(`/contractors/${contractorId}/jobs/${jobId}/admin`);
}

export async function clockInJob(contractorId: string, jobId: string): Promise<ActionResult<TimeEntry>> {
  return callEngine(`/contractors/${contractorId}/jobs/${jobId}/time/clock-in`, { method: 'POST', body: '{}' });
}

export async function clockOutJob(contractorId: string, jobId: string): Promise<ActionResult<TimeEntry>> {
  return callEngine(`/contractors/${contractorId}/jobs/${jobId}/time/clock-out`, { method: 'POST', body: '{}' });
}

export async function logJobHours(
  contractorId: string,
  jobId: string,
  hours: number,
  notes: string,
): Promise<ActionResult<TimeEntry>> {
  return callEngine(`/contractors/${contractorId}/jobs/${jobId}/time`, {
    method: 'POST',
    body: JSON.stringify({ hours, notes }),
  });
}

export async function addJobMaterial(
  contractorId: string,
  jobId: string,
  input: { description: string; amount: number; receipt_path?: string },
): Promise<ActionResult<MaterialCost>> {
  return callEngine(`/contractors/${contractorId}/jobs/${jobId}/materials`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function saveAgreedPrice(
  contractorId: string,
  jobId: string,
  agreed_price: number | null,
): Promise<ActionResult<{ agreed_price: number | null }>> {
  return callEngine(`/contractors/${contractorId}/jobs/${jobId}/agreed-price`, {
    method: 'POST',
    body: JSON.stringify({ agreed_price }),
  });
}
