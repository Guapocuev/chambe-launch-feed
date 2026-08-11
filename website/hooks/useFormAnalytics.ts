'use client';

import { useEffect } from 'react';
import { useRef } from 'react';
import { trackEvent } from '@/lib/analytics';

export function useFormAnalytics(
  form: 'quote' | 'apply',
  status: 'idle' | 'success' | 'error' | 'pending_retry',
) {
  const started = useRef(false);

  const markStarted = () => {
    if (!started.current) {
      started.current = true;
      trackEvent({ name: 'form_start', params: { form } });
    }
  };

  useEffect(() => {
    if (status === 'success') {
      trackEvent({ name: 'form_submit', params: { form, status: 'success' } });
    } else if (status === 'error') {
      trackEvent({ name: 'form_submit', params: { form, status: 'error' } });
    } else if (status === 'pending_retry') {
      trackEvent({ name: 'form_submit', params: { form, status: 'pending_retry' } });
    }
  }, [form, status]);

  return { markStarted };
}
