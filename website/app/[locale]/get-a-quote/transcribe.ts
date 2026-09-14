'use server';

import { getTranslations } from 'next-intl/server';
import { OPENAI_API_KEY, OPENAI_TRANSCRIBE_MODEL } from '@/lib/config';
import { allowVisitor } from '@/lib/rate-limit';

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
    const t = await getTranslations('Errors');
    return { error: t('voiceNotSetup') };
  }

  const file = audioFileFromForm(formData.get('audio'));
  if (!file) {
    const t = await getTranslations('Errors');
    return { error: t('voiceNoAudio') };
  }
  if (file.size > MAX_BYTES) {
    const t = await getTranslations('Errors');
    return { error: t('voiceTooLong') };
  }

  if (!(await allowVisitor('voice', 10))) {
    const t = await getTranslations('Errors');
    return { error: t('rateLimited') };
  }

  const type = (file.type || 'audio/webm').split(';')[0];
  if (type && !ALLOWED_TYPES.has(type) && !type.startsWith('audio/')) {
    return { error: (await getTranslations('Errors'))('voiceFormat') };
  }

  const locale = String(formData.get('locale') ?? 'en').trim() === 'es' ? 'es' : 'en';
  const filename = filenameFor(file.name, type);
  const body = new FormData();
  body.append('file', file, filename);
  body.append('model', OPENAI_TRANSCRIBE_MODEL);
  // Do not send `language` — Whisper auto-detects. The prompt is a hint only.
  body.append('prompt', transcribeHint(locale));

  try {
    const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
      body,
      signal: AbortSignal.timeout(30_000),
    });

    const payload = (await res.json().catch(() => ({}))) as {
      text?: string;
      error?: { message?: string; code?: string; type?: string };
    };

    if (!res.ok) {
      const detail = payload.error?.message ?? JSON.stringify(payload);
      console.error('transcribeJobAudio OpenAI error', res.status, detail);
      return { error: await openAiTranscribeCopy(res.status, payload.error) };
    }

    const text = typeof payload.text === 'string' ? payload.text.trim() : '';
    if (!text) {
      return { error: (await getTranslations('Errors'))('voiceEmpty') };
    }
    return { text };
  } catch {
    return { error: (await getTranslations('Errors'))('voiceUnreachable') };
  }
}

function transcribeHint(locale: 'en' | 'es'): string {
  if (locale === 'es') {
    return 'Trabajo de reparación en Toronto: eléctrico, plomería o carpintería. Tomacorrientes, breakers, fugas, tuberías, puertas, molduras.';
  }
  return 'Home repair job in Toronto: electrical, plumbing, or carpentry. Outlets, breakers, leaks, pipes, doors, trim.';
}

function audioFileFromForm(value: FormDataEntryValue | null): File | null {
  if (value instanceof File && value.size > 0) return value;
  if (typeof Blob !== 'undefined' && value instanceof Blob && value.size > 0) {
    const type = value.type || 'audio/webm';
    return new File([value], filenameFor('', type), { type });
  }
  return null;
}

async function openAiTranscribeCopy(
  status: number,
  error?: { message?: string; code?: string; type?: string },
): Promise<string> {
  const t = await getTranslations('Errors');
  const message = (error?.message ?? '').toLowerCase();
  const code = `${error?.code ?? ''} ${error?.type ?? ''}`.toLowerCase();

  if (status === 401) {
    return t('voiceUnauthorized');
  }
  if (
    status === 429 &&
    (message.includes('credit') ||
      message.includes('quota') ||
      code.includes('insufficient_quota'))
  ) {
    return t('voiceCredits');
  }
  if (status === 429) {
    return t('voiceBusy');
  }
  if (status === 400 && (message.includes('format') || message.includes('file'))) {
    return t('voiceFormat');
  }
  return t('voiceFail');
}

function filenameFor(original: string, type: string): string {
  if (original && /\.(webm|mp3|mp4|m4a|wav|ogg|mpeg)$/i.test(original)) {
    const ext = original.match(/\.(webm|mp3|mp4|m4a|wav|ogg|mpeg)$/i)?.[1]?.toLowerCase();
    const typeLooksWav = type.includes('wav');
    const typeLooksMp4 = type.includes('mp4') || type.includes('m4a');
    // MediaRecorder often labels a WAV blob as job.webm; OpenAI sniffs bytes, but
    // the extension should match the content type we actually captured.
    if (ext === 'webm' && typeLooksWav) return 'job.wav';
    if (ext === 'webm' && typeLooksMp4) return 'job.m4a';
    return original;
  }
  if (type.includes('mp4') || type.includes('m4a')) return 'job.m4a';
  if (type.includes('mpeg') || type.includes('mp3')) return 'job.mp3';
  if (type.includes('wav')) return 'job.wav';
  if (type.includes('ogg')) return 'job.ogg';
  return 'job.webm';
}
