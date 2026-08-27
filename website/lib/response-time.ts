/**
 * Response-time promises. Homeowner job flow (10-minute accept + 15-minute
 * callback in business hours) must stay in lockstep with demand-engine
 * matching. Contractor applications are a manual review — 1 business day,
 * not the homeowner callback.
 */
export const CONTRACTOR_ACCEPT_MINUTES = 10;
export const CALLBACK_MINUTES = 15;
export const BUSINESS_HOURS_LABEL = '8am–8pm';
export const APPLICANT_CALLBACK = '1 business day';

export const MATCH_WINDOW = `The first contractor has ${CONTRACTOR_ACCEPT_MINUTES} minutes to accept — if they can't, we cascade to the next best match automatically.`;

export const CALLBACK_WINDOW = `During ${BUSINESS_HOURS_LABEL}, we call you back within ${CALLBACK_MINUTES} minutes. After hours, first thing the next morning.`;

export const APPLICANT_CALLBACK_WINDOW = `We'll call you within ${APPLICANT_CALLBACK} about next steps.`;

export function successFollowUpCopy(offersSent: number): string {
  const matchLine =
    offersSent > 0
      ? `We've matched your job with ${offersSent} nearby contractor${offersSent === 1 ? '' : 's'}.`
      : "We've logged your job and are lining up a contractor match.";
  return `${matchLine} ${MATCH_WINDOW} ${CALLBACK_WINDOW}`;
}

export const PENDING_RETRY_COPY = `We've received your request and are finishing your estimate. ${CALLBACK_WINDOW}`;
