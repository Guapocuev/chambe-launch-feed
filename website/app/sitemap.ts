import type { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';
import { PUBLIC_ROUTES, SITE_URL } from '@/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_ROUTES.map(({ path, priority, changeFrequency }) => {
    const languages: Record<string, string> = {};
    for (const locale of routing.locales) {
      const href = locale === routing.defaultLocale ? path : path === '/' ? `/${locale}` : `/${locale}${path}`;
      languages[locale === 'en' ? 'en-CA' : locale] = `${SITE_URL}${href}`;
    }
    languages['x-default'] = `${SITE_URL}${path}`;
    return {
      url: `${SITE_URL}${path}`,
      lastModified: new Date(),
      changeFrequency,
      priority,
      alternates: { languages },
    };
  });
}
