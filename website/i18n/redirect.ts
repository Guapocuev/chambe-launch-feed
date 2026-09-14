import { getLocale } from 'next-intl/server';
import { redirect } from '@/i18n/navigation';

/** Locale-aware Next.js redirect for Server Components and Server Actions. */
export async function redirectTo(href: string): Promise<never> {
  const locale = await getLocale();
  return redirect({ href, locale });
}
