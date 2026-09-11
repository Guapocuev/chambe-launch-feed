/** Browser-only. Builds the magic-link return URL from the current host. */
export function emailMagicLinkRedirectTo(callbackPath: string): string {
  const path = callbackPath.startsWith('/') ? callbackPath : `/${callbackPath}`;
  return `${window.location.origin}${path}`;
}
