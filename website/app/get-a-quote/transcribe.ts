'use server';

import { OPENAI_API_KEY, OPENAI_TRANSCRIBE_MODEL } from '@/lib/config';

const MAX_BYTES = 4 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  'audio/webm',
  'audio/mp4',
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/m4a',
  'audio/ogg',
  'video/webm',
]);

export async function transcribeJobAudio(
  formData: FormData,
): Promise<{ text: string } | { error: string }> {
  if (!OPENAI_API_KEY) {
    return { error: "Voice input isn't set up yet. You can still type the job." };
  }

  const file = formData.get('audio');
  if (!(file instanceof File) || file.size === 0) {
    return { error: 'No audio was captured. Try the mic again.' };
  }
  if (file.size > MAX_BYTES) {
    return { error: 'That recording is too long. Keep it under about a minute.' };
  }

  const type = (file.type || 'audio/webm').split(';')[0];
  if (type && !ALLOWED_TYPES.has(type) && !type.startsWith('audio/')) {
    return { error: "That audio format isn't supported. Try again, or type the job." };
  }

  const filename = filenameFor(file.name, type);
  const body = new FormData();
  body.append('file', file, filename);
  body.append('model', OPENAI_TRANSCRIBE_MODEL);
  body.append('language', 'en');
  body.append(
    'prompt',
    'Home repair job in Toronto: electrical, plumbing, or carpentry. Outlets, breakers, leaks, pipes, doors, trim.',
  );

  try {
    const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
      body,
      signal: AbortSignal.timeout(30_000),
    });

    const payload = (await res.json().catch(() => ({}))) as {
      text?: string;
      error?: { message?: string };
    };

    if (!res.ok) {
      console.error(
        'transcribeJobAudio OpenAI error',
        res.status,
        payload.error?.message ?? payload,
      );
      return { error: "Couldn't transcribe that just now. Try again, or type the job." };
    }

    const text = typeof payload.text === 'string' ? payload.text.trim() : '';
    if (!text) {
      return { error: "Didn't catch any speech. Try again a bit closer to the mic." };
    }
    return { text };
  } catch {
    return { error: "Couldn't reach transcription just now. You can still type the job." };
  }
}

function filenameFor(original: string, type: string): string {
  if (original && /\.(webm|mp3|mp4|m4a|wav|ogg|mpeg)$/i.test(original)) return original;
  if (type.includes('mp4') || type.includes('m4a')) return 'job.m4a';
  if (type.includes('mpeg') || type.includes('mp3')) return 'job.mp3';
  if (type.includes('wav')) return 'job.wav';
  if (type.includes('ogg')) return 'job.ogg';
  return 'job.webm';
}
