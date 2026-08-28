/**
 * Server-only config. No NEXT_PUBLIC_ prefix on purpose — the demand-engine
 * URL is only ever called from Server Actions (see app/get-a-quote/actions.ts
 * and app/apply/actions.ts), never from the browser. That also means it
 * resolves fine to a Docker-internal hostname like http://demand-engine:3000
 * in docker-compose, which a browser-side fetch never could.
 */
export const DEMAND_ENGINE_URL = process.env.DEMAND_ENGINE_URL ?? 'http://localhost:3000';

/**
 * Must match the Demand Engine's FORM_API_KEY exactly — see
 * Chambe-mvp/demand-engine/.env.example and
 * src/middleware/require-api-key.middleware.ts. Both
 * POST /webhooks/tally-intake and POST /contractors/apply now reject
 * every request with 401/503 without this header, so an empty value
 * here isn't a "degrades gracefully" case like the other optional env
 * vars in this file — both forms will fail outright until it's set.
 */
export const DEMAND_ENGINE_API_KEY = process.env.DEMAND_ENGINE_API_KEY ?? '';

/**
 * Server-only. Used by the quote form's speech-to-text (OpenAI
 * /v1/audio/transcriptions). Never expose via NEXT_PUBLIC_ — the browser
 * only uploads audio to a Server Action, which holds this key.
 * Quote-engine already uses the same env name for scope extraction; you
 * can reuse that key here, but the website does not inherit it automatically.
 */
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY ?? '';

/** whisper-1 is the default transcription model (widest key compatibility). */
export const OPENAI_TRANSCRIBE_MODEL = process.env.OPENAI_TRANSCRIBE_MODEL ?? 'whisper-1';

/** Chat completions for apprentice jobsite Q&A. Server-only. */
export const OPENAI_CHAT_MODEL = process.env.OPENAI_CHAT_MODEL ?? 'gpt-4o-mini';

/** Public Supabase project URL — needed for contractor Auth (OTP / magic link). */
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '';

/** Anon key only. Never put the service role key on the website. */
export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY ?? '';

export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}
