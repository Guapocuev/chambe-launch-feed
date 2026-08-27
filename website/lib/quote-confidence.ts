/**
 * Client-side mirror of quote-engine form-completeness docks.
 * Used to nudge before submit (hints + optional follow-ups).
 * The engine still owns the real score, quote_type cutoffs (80/55),
 * and the post-submit display cap (99).
 */

export const DISPLAY_SCORE_CAP = 99;
export const FOLLOW_UP_THRESHOLD = 70;

const TRADE_KEYWORDS: Record<'electrical' | 'plumbing' | 'carpentry', string[]> = {
  electrical: [
    'wire',
    'wiring',
    'outlet',
    'receptacle',
    'breaker',
    'panel',
    'circuit',
    'switch',
    'light',
    'fixture',
    'dimmer',
    'gfci',
    'electrical',
    'voltage',
    'plug',
    'socket',
  ],
  plumbing: [
    'leak',
    'pipe',
    'drain',
    'water',
    'faucet',
    'toilet',
    'shower',
    'plumbing',
    'clog',
    'drip',
    'tap',
    'sink',
    'valve',
  ],
  carpentry: [
    'door',
    'frame',
    'trim',
    'deck',
    'fence',
    'wood',
    'carpentry',
    'cabinet',
    'window',
    'baseboard',
    'drywall',
    'railing',
  ],
};

const POSTAL_RE = /\b[A-Za-z]\d[A-Za-z]\s*\d[A-Za-z]\d\b/i;

export type Trade = 'electrical' | 'plumbing' | 'carpentry';

export interface FormConfidenceInput {
  photoCount: number;
  description: string;
  address: string | null;
  urgencySubmitted: boolean;
  jobSizeSubmitted: boolean;
  safetySubmitted: boolean;
}

export interface FollowUpQuestion {
  id: string;
  prompt: string;
}

const FOLLOW_UP_BANK: Record<Trade, FollowUpQuestion[]> = {
  electrical: [
    { id: 'elec_gfci', prompt: 'Is this a GFCI / outdoor / kitchen-bath outlet?' },
    { id: 'elec_breaker', prompt: 'Is the breaker tripping, or is the outlet just dead?' },
    { id: 'elec_count', prompt: 'How many outlets, switches, or fixtures?' },
  ],
  plumbing: [
    { id: 'plumb_source', prompt: 'Can you see where the water is coming from?' },
    { id: 'plumb_count', prompt: 'How many pipes, fixtures, or leak points?' },
    { id: 'plumb_pipe', prompt: 'Copper, PEX, or not sure what the piping is?' },
    { id: 'plumb_severity', prompt: 'Is it a drip, a steady leak, or a shut-off-the-water leak?' },
  ],
  carpentry: [
    { id: 'carp_where', prompt: 'Interior or exterior?' },
    { id: 'carp_failure', prompt: 'Rot, a break, or something that no longer fits (door/trim)?' },
    { id: 'carp_size', prompt: 'Rough size — one piece, a room, or a whole deck/fence run?' },
  ],
};

const SKIP_KEYWORDS: Record<string, string[]> = {
  elec_gfci: ['gfci', 'gfi', 'outdoor', 'kitchen', 'bath'],
  elec_breaker: ['breaker', 'tripping', 'trips', 'dead'],
  elec_count: ['outlets', 'switches', 'fixtures'],
  plumb_pipe: ['copper', 'pex', 'galvanized', 'cpvc'],
  plumb_source: ['from the', 'under the', 'behind the', 'near the', 'at the'],
  plumb_count: [],
  plumb_severity: ['drip', 'steady', 'shut-off', 'shut off', 'flooding', 'gushing'],
  carp_where: ['interior', 'exterior', 'indoor', 'outdoor'],
  carp_failure: ['rot', 'rotting', 'broken', 'broke', "won't fit", 'sticking', 'warped'],
  carp_size: ['one piece', 'whole', 'deck', 'fence', 'room'],
};

export function hasStreetNumber(address: string): boolean {
  const stripped = address.replace(POSTAL_RE, ' ');
  return /\d/.test(stripped);
}

export function isPartialAddress(address: string): boolean {
  const trimmed = address.trim();
  return trimmed.length > 0 && !hasStreetNumber(trimmed);
}

export function detectTrade(description: string): Trade | null {
  const text = description.toLowerCase();
  const scores = (Object.keys(TRADE_KEYWORDS) as Trade[]).map((trade) => ({
    trade,
    score: TRADE_KEYWORDS[trade].reduce((n, kw) => n + (text.includes(kw) ? 1 : 0), 0),
  }));
  scores.sort((a, b) => b.score - a.score);
  if (!scores[0] || scores[0].score === 0) return null;
  if (scores[1] && scores[1].score === scores[0].score) return null;
  return scores[0].trade;
}

function hasTradeKeyword(description: string): boolean {
  const text = description.toLowerCase();
  return (Object.values(TRADE_KEYWORDS) as string[][]).some((kws) => kws.some((kw) => text.includes(kw)));
}

export function formDisplayScore(input: FormConfidenceInput): number {
  let score = 100;
  const n = input.photoCount;
  if (n <= 0) score -= 15;
  else if (n === 1) score -= 8;
  else if (n === 2) score -= 3;

  const desc = input.description.trim();
  if (desc.length < 40) score -= 12;
  else if (desc.length < 120) score -= 6;
  else if (!hasTradeKeyword(desc)) score -= 4;

  if (input.address !== null) {
    if (!hasStreetNumber(input.address)) score -= 10;
    else if (!/[A-Za-z]\d[A-Za-z]\s*\d[A-Za-z]\d/i.test(input.address) && !/\b(toronto|north york|scarborough|etobicoke|mississauga|brampton|vaughan|markham|gta)\b/i.test(input.address)) {
      score -= 5;
    }
  }

  if (!input.urgencySubmitted) score -= 4;
  if (!input.jobSizeSubmitted) score -= 4;
  if (!input.safetySubmitted) score -= 3;

  return Math.min(DISPLAY_SCORE_CAP, Math.max(0, score));
}

export function pickFormFollowUps(description: string, display: number): FollowUpQuestion[] {
  if (display >= FOLLOW_UP_THRESHOLD) return [];

  const text = description.toLowerCase();
  const trade = detectTrade(description);
  const out: FollowUpQuestion[] = [];

  if (!trade) {
    return [{ id: 'trade_picker', prompt: 'Is this mainly electrical, plumbing, or carpentry?' }];
  }

  for (const q of FOLLOW_UP_BANK[trade]) {
    const skips = SKIP_KEYWORDS[q.id] ?? [];
    if (skips.some((kw) => text.includes(kw))) continue;
    if (q.id === 'elec_count' && /\d+\s+(outlet|switch|fixture|light)/i.test(description)) continue;
    if (q.id === 'plumb_count' && /\d+\s+(pipe|fixture|faucet|toilet|leak)/i.test(description)) continue;
    out.push(q);
    if (out.length >= 3) break;
  }
  return out;
}

export function composeFollowUpNotes(
  questions: FollowUpQuestion[],
  answers: Record<string, string>,
): string {
  const byId = new Map<string, FollowUpQuestion>();
  byId.set('trade_picker', {
    id: 'trade_picker',
    prompt: 'Is this mainly electrical, plumbing, or carpentry?',
  });
  for (const q of Object.values(FOLLOW_UP_BANK).flat()) byId.set(q.id, q);
  for (const q of questions) byId.set(q.id, q);

  const lines = Object.entries(answers)
    .map(([id, raw]) => {
      const answer = raw.trim();
      if (!answer) return null;
      const prompt = byId.get(id)?.prompt;
      if (!prompt) return null;
      return `${prompt} ${answer}`;
    })
    .filter((line): line is string => Boolean(line));
  return lines.join('\n');
}
