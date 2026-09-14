import { createServerClient } from '@supabase/ssr';
import { cookies, headers } from 'next/headers';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '@/lib/config';
import { cookieOptionsForOrigin } from '@/lib/supabase/cookie-options';

export async function createServerSupabase() {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const protocol = headerStore.get('x-forwarded-proto') === 'https' ? 'https:' : 'http:';
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, cookieOptionsForOrigin(options, protocol));
          }
        } catch {
          // Called from a Server Component — middleware already refreshed the session.
        }
      },
    },
  });
}
