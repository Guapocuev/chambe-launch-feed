import { DEMAND_ENGINE_API_KEY } from '@/lib/config';
import { visitorIp } from '@/lib/client-ip';

export async function demandEngineHeaders(): Promise<Record<string, string>> {
  const ip = await visitorIp();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Api-Key': DEMAND_ENGINE_API_KEY,
  };
  if (ip !== 'unknown') {
    headers['X-Chambe-Client-Ip'] = ip;
  }
  return headers;
}
