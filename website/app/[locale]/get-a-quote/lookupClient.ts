'use server';

import { lookupReturningClient, type ReturningClientLookup } from '@/lib/returning-client';

/**
 * Server action the quote page can call before (or while) rendering the
 * form. Thin wrapper so the browser never talks to the Demand Engine.
 */
export async function lookupClientAction(phone: string): Promise<ReturningClientLookup> {
  return lookupReturningClient(phone);
}
