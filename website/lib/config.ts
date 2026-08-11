/**
 * Server-only config. No NEXT_PUBLIC_ prefix on purpose — the demand-engine
 * URL is only ever called from Server Actions (see app/get-a-quote/actions.ts
 * and app/apply/actions.ts), never from the browser. That also means it
 * resolves fine to a Docker-internal hostname like http://demand-engine:3000
 * in docker-compose, which a browser-side fetch never could.
 */
export const DEMAND_ENGINE_URL = process.env.DEMAND_ENGINE_URL ?? 'http://localhost:3000';
