'use server';

import { DEMAND_ENGINE_API_KEY, DEMAND_ENGINE_URL } from '@/lib/config';

export type ApprenticeTrade = 'electrical' | 'plumbing' | 'carpentry';

export interface HourTarget {
  level: number;
  name: string;
  target_hours: number;
  earned_hours: number;
  complete: boolean;
}

export interface HourProgress {
  total_hours: number;
  target_total: number;
  current_level: number;
  levels: HourTarget[];
}

export interface ApprenticeProfile {
  id: string;
  full_name: string | null;
  phone: string;
  email: string | null;
  trade: ApprenticeTrade;
  supervisor_id: string | null;
  supervisor_name: string | null;
}

export interface ApprenticeHourEntry {
  id: string;
  hours: number;
  notes: string | null;
  worked_on: string;
  created_at: string;
}

export interface ApprenticeQuestion {
  id: string;
  trade: ApprenticeTrade;
  question: string;
  answer: string;
  created_at: string;
}

export interface ApprenticeDashboard {
  apprentice: ApprenticeProfile;
  progress: HourProgress;
  hours: ApprenticeHourEntry[];
  questions: ApprenticeQuestion[];
}

export type ResolveApprenticeResult =
  | { ok: true; status: 'ok'; dashboard: ApprenticeDashboard }
  | { ok: true; status: 'needs_join' }
  | { ok: false; error: string };

async function accessToken(): Promise<string | null> {
  const { createServerSupabase } = await import('@/lib/supabase/server');
  const supabase = await createServerSupabase();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

async function callApprentices<T>(path: string, init?: RequestInit): Promise<{ ok: true; data: T } | { ok: false; error: string; status: number }> {
  const token = await accessToken();
  if (!token) return { ok: false, error: 'Sign in to continue.', status: 401 };
  try {
    const res = await fetch(`${DEMAND_ENGINE_URL}/apprentices${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'X-Api-Key': DEMAND_ENGINE_API_KEY,
        ...(init?.headers ?? {}),
      },
      signal: AbortSignal.timeout(12_000),
    });
    const body = (await res.json().catch(() => ({}))) as T & { error?: string };
    if (!res.ok) {
      return { ok: false, error: typeof body.error === 'string' ? body.error : 'Request failed.', status: res.status };
    }
    return { ok: true, data: body as T };
  } catch {
    return { ok: false, error: 'Could not reach Chambé. Try again in a moment.', status: 503 };
  }
}

export async function resolveApprenticeSession(): Promise<ResolveApprenticeResult> {
  const result = await callApprentices<{ status?: string; dashboard?: ApprenticeDashboard; error?: string }>(
    '/auth/resolve',
    { method: 'POST', body: '{}' },
  );
  if (!result.ok) return { ok: false, error: result.error };
  if (result.data.status === 'ok' && result.data.dashboard) {
    return { ok: true, status: 'ok', dashboard: result.data.dashboard };
  }
  if (result.data.status === 'needs_join') {
    return { ok: true, status: 'needs_join' };
  }
  return { ok: false, error: result.data.error ?? 'Could not load your hours.' };
}

export async function joinApprenticeAction(formData: FormData): Promise<ResolveApprenticeResult> {
  const result = await callApprentices<{ status?: string; dashboard?: ApprenticeDashboard; error?: string }>(
    '/join',
    {
      method: 'POST',
      body: JSON.stringify({
        full_name: String(formData.get('full_name') ?? ''),
        phone: String(formData.get('phone') ?? ''),
        trade: String(formData.get('trade') ?? ''),
        supervisor_phone: String(formData.get('supervisor_phone') ?? ''),
      }),
    },
  );
  if (!result.ok) return { ok: false, error: result.error };
  if (result.data.status === 'ok' && result.data.dashboard) {
    return { ok: true, status: 'ok', dashboard: result.data.dashboard };
  }
  return { ok: false, error: result.data.error ?? 'Could not join.' };
}

export async function logApprenticeHoursAction(formData: FormData): Promise<{ ok: true } | { ok: false; error: string }> {
  const result = await callApprentices('/hours', {
    method: 'POST',
    body: JSON.stringify({
      hours: Number(formData.get('hours')),
      notes: String(formData.get('notes') ?? ''),
      worked_on: String(formData.get('worked_on') ?? ''),
    }),
  });
  if (!result.ok) return { ok: false, error: result.error };
  return { ok: true };
}

export async function saveApprenticeQuestionAction(input: {
  question: string;
  answer: string;
  trade: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const result = await callApprentices('/questions', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  if (!result.ok) return { ok: false, error: result.error };
  return { ok: true };
}

export async function inviteApprenticeAction(formData: FormData): Promise<{ ok: true } | { ok: false; error: string }> {
  const result = await callApprentices('/invites', {
    method: 'POST',
    body: JSON.stringify({
      full_name: String(formData.get('full_name') ?? ''),
      phone: String(formData.get('phone') ?? ''),
      trade: String(formData.get('trade') ?? ''),
    }),
  });
  if (!result.ok) return { ok: false, error: result.error };
  return { ok: true };
}

export async function loadSupervisedApprentices(): Promise<
  | {
      ok: true;
      apprentices: Array<{
        apprentice: ApprenticeProfile;
        progress: HourProgress;
        hours: ApprenticeHourEntry[];
        questions: ApprenticeQuestion[];
      }>;
      pending: Array<{ id: string; full_name: string; phone: string; trade: string }>;
    }
  | { ok: false; error: string }
> {
  const result = await callApprentices<{
    apprentices: Array<{
      apprentice: ApprenticeProfile;
      progress: HourProgress;
      hours: ApprenticeHourEntry[];
      questions: ApprenticeQuestion[];
    }>;
    pending: Array<{ id: string; full_name: string; phone: string; trade: string }>;
  }>('/supervised');
  if (!result.ok) return { ok: false, error: result.error };
  return { ok: true, apprentices: result.data.apprentices ?? [], pending: result.data.pending ?? [] };
}

export async function signOutApprentice(): Promise<void> {
  const { createServerSupabase } = await import('@/lib/supabase/server');
  const { redirect } = await import('next/navigation');
  const supabase = await createServerSupabase();
  await supabase.auth.signOut();
  redirect('/apprentice/login');
}
