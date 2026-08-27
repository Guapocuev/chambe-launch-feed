export type AnalyticsEvent =
  | { name: 'cta_click'; params: { location: string; label: string; href: string } }
  | { name: 'form_start'; params: { form: 'quote' | 'apply' } }
  | {
      name: 'form_submit';
      params: { form: 'quote' | 'apply'; status: 'success' | 'error' | 'pending_retry' };
    }
  | { name: 'phone_click'; params: { location: string } };

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    plausible?: (event: string, options?: { props: Record<string, string> }) => void;
  }
}

function flattenParams(params: Record<string, string>): Record<string, string> {
  return params;
}

/** Fire a conversion/analytics event to GA4 and/or Plausible when configured. */
export function trackEvent(event: AnalyticsEvent): void {
  if (typeof window === 'undefined') return;

  const params = flattenParams(event.params as Record<string, string>);

  if (window.gtag) {
    window.gtag('event', event.name, params);
  }

  if (window.plausible) {
    window.plausible(event.name, { props: params });
  }

  if (process.env.NODE_ENV === 'development') {
    console.debug('[analytics]', event.name, params);
  }
}
