/** Browser-only. Magic-link return URLs must use the current host, never SITE_URL. */

const AUTH_NEXT_KEY = 'chambe_auth_next';

export function rememberAuthReturnTo(path: string): void {
  const next = path.startsWith('/') ? path : `/${path}`;
  try {
    sessionStorage.setItem(AUTH_NEXT_KEY, next);
  } catch {
    // ignore quota / private-mode
  }
}

export function peekAuthReturnTo(): string | null {
  try {
    return sessionStorage.getItem(AUTH_NEXT_KEY);
  } catch {
    return null;
  }
}

export function takeAuthReturnTo(): string | null {
  const value = peekAuthReturnTo();
  if (value) {
    try {
      sessionStorage.removeItem(AUTH_NEXT_KEY);
    } catch {
      // ignore
    }
  }
  return value;
}

/** PKCE verifier lives on this origin — the email must return here, not chambe.ca by default. */
export function emailMagicLinkRedirectTo(callbackPath: string): string {
  const path = callbackPath.startsWith('/') ? callbackPath : `/${callbackPath}`;
  return `${window.location.origin}${path}`;
}

export function visualizeMagicLinkCallbackPath(sessionId: string): string {
  return `/visualize/auth/callback/${encodeURIComponent(sessionId)}`;
}

export function resumeIdFromAuthLocation(href: string): string | null {
  const url = new URL(href, 'https://chambe.ca');
  const fromQuery = url.searchParams.get('resume');
  if (fromQuery) return fromQuery;
  const match = url.pathname.match(/\/visualize\/auth\/callback\/([^/]+)/);
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}
