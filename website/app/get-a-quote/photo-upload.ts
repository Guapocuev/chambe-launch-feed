'use server';

import { DEMAND_ENGINE_API_KEY, DEMAND_ENGINE_URL } from '@/lib/config';

export async function signPhotoUpload(
  contentType: string,
  uploadId: string,
): Promise<{ path: string; signedUrl: string } | { error: string }> {
  try {
    const res = await fetch(`${DEMAND_ENGINE_URL}/media/sign-upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Api-Key': DEMAND_ENGINE_API_KEY },
      body: JSON.stringify({ contentType, uploadId }),
      signal: AbortSignal.timeout(8_000),
    });
    const body = (await res.json().catch(() => ({}))) as { path?: string; signedUrl?: string; error?: string };
    if (!res.ok || !body.path || !body.signedUrl) {
      return { error: typeof body.error === 'string' ? body.error : 'Photo upload is unavailable right now.' };
    }
    return { path: body.path, signedUrl: body.signedUrl };
  } catch {
    return { error: 'Photo upload is unavailable right now.' };
  }
}
