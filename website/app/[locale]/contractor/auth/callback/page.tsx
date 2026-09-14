import type { Metadata } from 'next';
import { ContractorAuthCallback } from '../../ContractorAuthCallback';

export const metadata: Metadata = {
  title: 'Signing in',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default function ContractorAuthCallbackPage() {
  return <ContractorAuthCallback />;
}
