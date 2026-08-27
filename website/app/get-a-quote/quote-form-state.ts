export interface QuoteFormState {
  status: 'idle' | 'success' | 'pending_retry' | 'error';
  message?: string;
  quote?: {
    low: number;
    high: number;
    priority: string;
    trade: string | null;
    offers_sent: number;
  };
}

export const initialQuoteFormState: QuoteFormState = { status: 'idle' };
