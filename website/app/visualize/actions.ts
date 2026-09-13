'use server';

import { DEMAND_ENGINE_API_KEY, DEMAND_ENGINE_URL } from '@/lib/config';

export interface VisualizeSession {
  id: string;
  status: string;
  style: string;
  hero_photo_url: string | null;
  generated_photo_url: string | null;
  prompt: string | null;
  model_id: string | null;
  area_sqft: number | null;
  area_sqft_source: 'job_features' | 'package_default' | null;
  estimate_low: number | null;
  estimate_high: number | null;
  price_cad: number;
  error_message: string | null;
  paid: boolean;
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

export async function generateVisualizePreview(sessionId: string): Promise<ActionResult<VisualizeSession>> {
  return callVisualize(`/visualize/sessions/${sessionId}/generate`, { method: 'POST', body: '{}' }, 70_000);
}

export async function getVisualizeSession(sessionId: string): Promise<ActionResult<VisualizeSession>> {
  return callVisualize(`/visualize/sessions/${sessionId}`, { method: 'GET' });
}
