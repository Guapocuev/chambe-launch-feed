import { type NextRequest } from 'next/server';
import { updateContractorSession } from '@/lib/supabase/middleware';

export async function proxy(request: NextRequest) {
  return updateContractorSession(request);
}

export const config = {
  matcher: ['/contractor', '/contractor/:path*', '/apprentice', '/apprentice/:path*'],
};
