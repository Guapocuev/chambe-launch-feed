import type { Metadata } from 'next';
import { ContractorAuthCallback } from '@/app/contractor/ContractorAuthCallback';

export const metadata: Metadata = {
  title: 'Signing in',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default function VisualizeAuthCallbackPage() {
  return (
    <ContractorAuthCallback
      homePath="/visualize"
      loginPath="/visualize/login"
      heading="Opening your kitchen preview…"
    />
  );
}
