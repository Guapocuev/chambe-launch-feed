import { headers } from 'next/headers';

/**
 * Visitor IP as seen by Netlify / Caddy in front of the Next server.
 * Used to rate-limit Server Actions (the Demand Engine would otherwise
 * see only the site's outbound IP).
 */
export async function visitorIp(): Promise<string> {
  const h = await headers();
  const forwarded =
    h.get('x-nf-client-connection-ip') ?? h.get('x-forwarded-for') ?? h.get('x-real-ip') ?? '';
  const ip = forwarded.split(',')[0]?.trim() ?? '';
  return ip.length > 0 ? ip : 'unknown';
}
