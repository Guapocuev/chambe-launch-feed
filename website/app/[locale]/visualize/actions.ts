'use server';

import { DEMAND_ENGINE_API_KEY, DEMAND_ENGINE_URL } from '@/lib/config';

export interface VisualizePackage {
  id: string;
  slug: string;
  estimate_low: number;
  estimate_high: number;
}

export interface FinishOption {
  id: string;
  category: 'cabinet_scope' | 'cabinet_finish' | 'countertop' | 'flooring' | 'lighting' | 'backsplash';
  slug: string;
  label: string;
  swatch_hex: string | null;
  flux_fragment: string;
  labor_hours_delta: number;
  material_cost: number;
  compatible_with: string[] | null;
  pricing_is_draft: boolean;
  sort_order: number;
}

export interface EstimateBreakdownLine {
  slug: string | null;
  label: string;
  hours: number | null;
  rate: number | null;
  subtotal: number;
}

export interface EstimateBreakdown {
  labor: EstimateBreakdownLine;
  cabinets: EstimateBreakdownLine;
  counters: EstimateBreakdownLine;
  flooring: EstimateBreakdownLine;
  lighting: EstimateBreakdownLine;
  backsplash: EstimateBreakdownLine;
  dispatch: EstimateBreakdownLine;
  range: { low: number; high: number };
  area_sqft: number;
  labor_hours_unscaled: number;
  material_total: number;
  pricing_is_draft: boolean;
}

export interface VisualizeSession {
  id: string;
  status: string;
  style: string;
  package_id: string | null;
  package_slug: string | null;
  generated_package_id: string | null;
  hero_photo_url: string | null;
  generated_photo_url: string | null;
  prompt: string | null;
  assembled_prompt: string | null;
  model_id: string | null;
  area_sqft: number | null;
  area_sqft_source: 'job_features' | 'package_default' | 'session_input' | null;
  estimate_low: number | null;
  estimate_high: number | null;
  estimate_breakdown: EstimateBreakdown | null;
  selections: Partial<Record<FinishOption['category'], string>>;
  must_haves: string;
  selection_hash: string | null;
  generated_selection_hash: string | null;
  preview_stale: boolean;
  selections_complete: boolean;
  price_cad: number;
  error_message: string | null;
  paid: boolean;
  packages: VisualizePackage[];
  options: FinishOption[];
}

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

async function callVisualize<T>(path: string, init?: RequestInit, timeoutMs = 20_000): Promise<ActionResult<T>> {
  const { createServerSupabase } = await import('@/lib/supabase/server');
  const supabase = await createServerSupabase();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) {
    return { ok: false, error: 'Sign in again.' };
  }

  try {
    const res = await fetch(`${DEMAND_ENGINE_URL}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': DEMAND_ENGINE_API_KEY,
        Authorization: `Bearer ${session.access_token}`,
        ...(init?.headers ?? {}),
      },
      signal: AbortSignal.timeout(timeoutMs),
    });
    const body = (await res.json().catch(() => ({}))) as T & { error?: string };
    if (!res.ok) {
      return { ok: false, error: typeof body.error === 'string' ? body.error : 'Request failed.' };
    }
    return { ok: true, data: body as T };
  } catch {
    return { ok: false, error: 'Could not reach the preview service. Try again in a moment.' };
  }
}

export async function resolveVisualizeSession(): Promise<
  ActionResult<{ homeowner: { id: string; email: string | null }; session: VisualizeSession }>
> {
  return callVisualize('/visualize/auth/resolve', { method: 'POST', body: '{}' });
}

export async function attachVisualizePhoto(sessionId: string, path: string): Promise<ActionResult<VisualizeSession>> {
  return callVisualize(`/visualize/sessions/${sessionId}/photo`, {
    method: 'POST',
    body: JSON.stringify({ path }),
  });
}

export async function startVisualizeCheckout(sessionId: string): Promise<ActionResult<{ checkout_url: string }>> {
  return callVisualize(`/visualize/sessions/${sessionId}/checkout`, { method: 'POST', body: '{}' });
}

export async function confirmVisualizeCheckout(
  sessionId: string,
  checkoutSessionId: string,
): Promise<ActionResult<VisualizeSession>> {
  return callVisualize(`/visualize/sessions/${sessionId}/confirm`, {
    method: 'POST',
    body: JSON.stringify({ checkout_session_id: checkoutSessionId }),
  });
}

export async function selectVisualizePackage(
  sessionId: string,
  packageId: string,
): Promise<ActionResult<VisualizeSession>> {
  return callVisualize(`/visualize/sessions/${sessionId}/package`, {
    method: 'POST',
    body: JSON.stringify({ package_id: packageId }),
  });
}

export async function saveVisualizeSelections(
  sessionId: string,
  input: {
    selections?: VisualizeSession['selections'];
    must_haves?: string;
    area_sqft?: number;
  },
): Promise<ActionResult<VisualizeSession>> {
  return callVisualize(`/visualize/sessions/${sessionId}/selections`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function generateVisualizePreview(sessionId: string): Promise<ActionResult<VisualizeSession>> {
  return callVisualize(`/visualize/sessions/${sessionId}/generate`, { method: 'POST', body: '{}' }, 70_000);
}

export async function getVisualizeSession(sessionId: string): Promise<ActionResult<VisualizeSession>> {
  return callVisualize(`/visualize/sessions/${sessionId}`, { method: 'GET' });
}
