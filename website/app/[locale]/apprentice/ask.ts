'use server';

import { OPENAI_API_KEY, OPENAI_CHAT_MODEL } from '@/lib/config';

const TRADE_LABEL: Record<string, string> = {
  electrical: 'electrical',
  plumbing: 'plumbing',
  carpentry: 'carpentry',
};

export async function answerApprenticeQuestion(
  question: string,
  trade: string,
): Promise<{ answer: string } | { error: string }> {
  const asked = question.trim();
  if (asked.length < 4) {
    return { error: 'Type a short question first.' };
  }
  if (!OPENAI_API_KEY) {
    return { error: 'Answers are not set up yet. Ask your supervisor in the meantime.' };
  }

  const tradeLabel = TRADE_LABEL[trade] ?? 'the trades';
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: OPENAI_CHAT_MODEL,
        temperature: 0.2,
        max_tokens: 400,
        messages: [
          {
            role: 'system',
            content:
              `You help a ${tradeLabel} apprentice on a job site in Ontario. Answer in plain English, short paragraphs, no fluff. ` +
              'If it is a code or safety question, say they still need their supervisor to sign off. ' +
              'Do not invent Ontario code numbers. If you are not sure, say so.',
          },
          { role: 'user', content: asked.slice(0, 2000) },
        ],
      }),
      signal: AbortSignal.timeout(25_000),
    });
    const payload = (await res.json().catch(() => ({}))) as {
      choices?: Array<{ message?: { content?: string } }>;
      error?: { message?: string };
    };
    if (!res.ok) {
      console.error('answerApprenticeQuestion OpenAI error', res.status, payload.error?.message ?? payload);
      return { error: 'Could not get an answer just now. Try again.' };
    }
    const answer = payload.choices?.[0]?.message?.content?.trim() ?? '';
    if (!answer) return { error: 'No answer came back. Try rephrasing.' };
    return { answer };
  } catch {
    return { error: 'Could not reach the answer service. Try again in a moment.' };
  }
}
