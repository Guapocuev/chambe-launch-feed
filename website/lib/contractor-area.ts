import { stripLocalePrefix } from '@/i18n/pathname';

export function isContractorArea(pathname: string): boolean {
  const path = stripLocalePrefix(pathname);
  return path === '/contractor' || path.startsWith('/contractor/');
}

export function isApprenticeArea(pathname: string): boolean {
  const path = stripLocalePrefix(pathname);
  return path === '/apprentice' || path.startsWith('/apprentice/');
}

export function isVisualizeArea(pathname: string): boolean {
  const path = stripLocalePrefix(pathname);
  return path === '/visualize' || path.startsWith('/visualize/');
}

export function isAppArea(pathname: string): boolean {
  return isContractorArea(pathname) || isApprenticeArea(pathname) || isVisualizeArea(pathname);
}
