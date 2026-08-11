/** Public site constants — safe for client and server components. */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://chambe.ca';

export const SITE_NAME = 'Chambé';

export const SITE_DESCRIPTION =
  'Tell us the job, get an instant AI-powered estimate, and get matched with a vetted local contractor. Serving Toronto and the GTA.';

export const CONTACT_EMAIL = 'hello@chambe.ca';

/** Set via NEXT_PUBLIC_CONTACT_PHONE in .env.local to enable click-to-call. */
export const CONTACT_PHONE = process.env.NEXT_PUBLIC_CONTACT_PHONE ?? '';

export const CONTACT_PHONE_TEL = CONTACT_PHONE
  ? `tel:${CONTACT_PHONE.replace(/\D/g, '')}`
  : '';

/** Google Analytics 4 measurement ID — e.g. G-XXXXXXXXXX */
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? '';

/** Plausible domain — e.g. chambe.ca */
export const PLAUSIBLE_DOMAIN = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN ?? '';

export const PUBLIC_ROUTES = [
  { path: '/', priority: 1.0, changeFrequency: 'weekly' as const },
  { path: '/get-a-quote', priority: 0.9, changeFrequency: 'monthly' as const },
  { path: '/how-it-works', priority: 0.8, changeFrequency: 'monthly' as const },
  { path: '/gallery', priority: 0.8, changeFrequency: 'weekly' as const },
  { path: '/about', priority: 0.7, changeFrequency: 'monthly' as const },
  { path: '/apply', priority: 0.7, changeFrequency: 'monthly' as const },
  { path: '/contact', priority: 0.6, changeFrequency: 'monthly' as const },
  { path: '/privacy', priority: 0.3, changeFrequency: 'yearly' as const },
  { path: '/terms', priority: 0.3, changeFrequency: 'yearly' as const },
];
