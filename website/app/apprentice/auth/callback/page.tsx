import type { Metadata } from 'next';
import { ContractorAuthCallback } from '@/app/contractor/ContractorAuthCallback';

export const metadata: Metadata = {
  title: 'Signing in',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default function ApprenticeAuthCallbackPage() {
  return (
    <ContractorAuthCallback
      homePath="/apprentice"
      loginPath="/apprentice/login"
      heading="Opening your hours…"
    />
  );
}
