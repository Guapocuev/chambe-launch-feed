/** Local http drops cookies flagged Secure. Keep production https cookies as-is. */
export function cookieOptionsForOrigin<T extends { secure?: boolean }>(
  options: T | undefined,
  protocol: string,
): T {
  const next = { ...(options ?? ({} as T)) };
  if (protocol === 'http:') next.secure = false;
  return next;
}
