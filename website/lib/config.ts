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
