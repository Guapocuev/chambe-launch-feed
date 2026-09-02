import { visitorIp } from '@/lib/client-ip';

export const RATE_LIMITED_COPY =
  'Too many requests from this network. Please wait a few minutes and try again.';

type Bucket = 'quote' | 'apply' | 'photo' | 'voice' | 'lookup';

const stores: Record<Bucket, Map<string, number[]>> = {
  quote: new Map(),
  apply: new Map(),
  photo: new Map(),
  voice: new Map(),
  lookup: new Map(),
};

const WINDOW_MS = 15 * 60 * 1000;

function allow(store: Map<string, number[]>, key: string, max: number, now = Date.now()): boolean {
  const windowStart = now - WINDOW_MS;
  const stamps = (store.get(key) ?? []).filter((t) => t > windowStart);
  if (stamps.length >= max) {
    store.set(key, stamps);
    return false;
  }
  stamps.push(now);
  store.set(key, stamps);
  return true;
}

/** Per-visitor caps. One real quote request never hits these. */
export async function allowVisitor(bucket: Bucket, max: number): Promise<boolean> {
  const ip = await visitorIp();
  return allow(stores[bucket], ip, max);
}
