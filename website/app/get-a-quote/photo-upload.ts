'use server';

import { demandEngineHeaders } from '@/lib/engine-request';
import { DEMAND_ENGINE_URL } from '@/lib/config';
import { allowVisitor, RATE_LIMITED_COPY } from '@/lib/rate-limit';

export async function signPhotoUpload(
  contentType: string,
  uploadId: string,
): Promise<{ path: string; signedUrl: string } | { error: string }> {
  if (!(await allowVisitor('photo', 20))) {
    return { error: RATE_LIMITED_COPY };
  }

  try {
    const res = await fetch(`${DEMAND_ENGINE_URL}/media/sign-upload`, {
      method: 'POST',
      headers: await demandEngineHeaders(),
      body: JSON.stringify({ contentType, uploadId }),
      signal: AbortSignal.timeout(8_000),
    });
    if (res.status === 429) {
      return { error: RATE_LIMITED_COPY };
    }
    const body = (await res.json().catch(() => ({}))) as { path?: string; signedUrl?: string; error?: string };
    if (!res.ok || !body.path || !body.signedUrl) {
      return { error: typeof body.error === 'string' ? body.error : 'Photo upload is unavailable right now.' };
    }
    return { path: body.path, signedUrl: body.signedUrl };
  } catch {
    return { error: 'Photo upload is unavailable right now.' };
  }
}
