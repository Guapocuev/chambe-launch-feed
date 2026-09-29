export type AnalyticsEvent =
  | { name: 'cta_click'; params: { location: string; label: string; href: string } }
  | { name: 'form_start'; params: { form: 'quote' | 'apply' } }
  | {
      name: 'form_submit';
      params: { form: 'quote' | 'apply'; status: 'success' | 'error' | 'pending_retry' };
    }
  | { name: 'phone_click'; params: { location: string } }
  | { name: 'purchase'; params: { transaction_id: string; value: number; currency: string } }
  | { name: 'quote_submitted'; params: Record<string, never> }
  | { name: 'contractor_applied'; params: Record<string, never> }
  | { name: 'apprentice_signup'; params: Record<string, never> };

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    plausible?: (event: string, options?: { props: Record<string, string> }) => void;
  }
}

/** Fire a conversion/analytics event to GA4 and/or Plausible when configured. */
export function trackEvent(event: AnalyticsEvent): void {
  if (typeof window === 'undefined') return;

  const params = event.params ?? {};

  if (window.gtag) {
    window.gtag('event', event.name, params);
  }

  if (window.plausible) {
    const props: Record<string, string> = {};
    for (const [key, value] of Object.entries(params)) {
      props[key] = String(value);
    }
    window.plausible(event.name, { props });
  }

  if (process.env.NODE_ENV === 'development') {
    console.debug('[analytics]', event.name, params);
  }
}

/** Wait for gtag.js when the conversion can race the afterInteractive script. */
export function trackEventWhenGtagReady(event: AnalyticsEvent, timeoutMs = 4000): void {
  if (typeof window === 'undefined') return;
  if (window.gtag) {
    trackEvent(event);
    return;
  }
  const started = Date.now();
  const timer = window.setInterval(() => {
    if (window.gtag || Date.now() - started > timeoutMs) {
      window.clearInterval(timer);
      trackEvent(event);
    }
  }, 200);
}
