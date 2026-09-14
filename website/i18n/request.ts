import { hasLocale } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';
import en from '../messages/en.json';
import es from '../messages/es.json';

const catalogs = { en, es } as const;

export default getRequestConfig(async ({ requestLocale, locale }) => {
  const requested = locale ?? (await requestLocale);
  const resolved = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  return {
    locale: resolved,
    messages: catalogs[resolved],
  };
});
