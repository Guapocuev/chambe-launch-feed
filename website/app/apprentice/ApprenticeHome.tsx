'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { transcribeJobAudio } from '@/app/get-a-quote/transcribe';
import { logApprenticeHoursAction, saveApprenticeQuestionAction, signOutApprentice, type ApprenticeDashboard } from './actions';
import { answerApprenticeQuestion } from './ask';

const fieldClass =
  'h-14 w-full rounded-2xl border border-border bg-background px-4 text-lg text-foreground placeholder:text-foreground/35 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent';
const primaryBtn =
  'flex h-14 w-full items-center justify-center rounded-2xl bg-accent text-lg font-semibold text-inverse disabled:opacity-50';

function tradeLabel(trade: string): string {
  if (trade === 'electrical') return 'Electrical';
  if (trade === 'plumbing') return 'Plumbing';
  if (trade === 'carpentry') return 'Carpentry';
  return trade;
}

function firstName(fullName: string | null): string {
  if (!fullName?.trim()) return 'there';
  return fullName.trim().split(/\s+/)[0] ?? 'there';
}

export function ApprenticeHome({ dashboard }: { dashboard: ApprenticeDashboard }) {
  const router = useRouter();
  const { apprentice, progress } = dashboard;
  const [hours, setHours] = useState('');
  const [notes, setNotes] = useState('');
  const [question, setQuestion] = useState('');
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [latestAnswer, setLatestAnswer] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);

  async function saveHours() {
    const value = parseFloat(hours);
    if (!Number.isFinite(value) || value <= 0) {
      setError('Enter hours, like 7.5');
      return;
    }
    setBusy(true);
    setError(null);
    const result = await logApprenticeHoursAction(formFrom({ hours: String(value), notes }));
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setHours('');
    setNotes('');
    router.refresh();
  }

  async function ask() {
    const asked = question.trim();
    if (asked.length < 4) {
      setError('Type or speak a short question.');
      return;
    }
    setBusy(true);
    setError(null);
    setLatestAnswer(null);
    const generated = await answerApprenticeQuestion(asked, apprentice.trade);
    if ('error' in generated) {
      setBusy(false);
      setError(generated.error);
      return;
    }
    const saved = await saveApprenticeQuestionAction({
      question: asked,
      answer: generated.answer,
      trade: apprentice.trade,
    });
    setBusy(false);
    if (!saved.ok) {
      setError(saved.error);
      return;
    }
    setLatestAnswer(generated.answer);
    setQuestion('');
    router.refresh();
  }

  async function speakQuestion() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : undefined;
      const recorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      const chunks: Blob[] = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        void (async () => {
          const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
          if (blob.size < 800) {
            setListening(false);
            setError('That was too short. Hold the mic, ask, then stop.');
            return;
          }
          const form = new FormData();
          form.append('audio', blob, 'question.webm');
          const result = await transcribeJobAudio(form);
          setListening(false);
          if ('error' in result) {
            setError(result.error);
            return;
          }
          setQuestion((prev) => {
            const spoken = result.text.trim();
            return prev.trim() ? `${prev.trim()} ${spoken}` : spoken;
          });
        })();
      };
      recorder.start(250);
      recorderRef.current = recorder;
      setListening(true);
      window.setTimeout(() => {
        if (recorder.state === 'recording') recorder.stop();
      }, 60_000);
    } catch {
      setListening(false);
      setError('Microphone access is needed to speak. You can still type.');
    }
  }

  function stopSpeaking() {
    const recorder = recorderRef.current;
    if (recorder && recorder.state === 'recording') recorder.stop();
  }

  return (
    <div className="mx-auto w-full max-w-md px-5 py-8">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-foreground/50">
            {tradeLabel(apprentice.trade)} apprentice
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground">
            Hey {firstName(apprentice.full_name)}
          </h1>
        </div>
        <form action={signOutApprentice}>
          <button type="submit" className="h-12 rounded-2xl border border-border px-4 text-base font-semibold">
            Log out
          </button>
        </form>
      </div>

      {apprentice.supervisor_name && (
        <p className="mt-3 text-base text-foreground/65">Supervisor: {apprentice.supervisor_name}</p>
      )}

      <section className="mt-8 rounded-2xl border border-border px-4 py-5">
        <p className="text-sm font-semibold uppercase tracking-wide text-foreground/50">Progress</p>
        <p className="mt-2 text-2xl font-bold tabular-nums text-foreground">
          {progress.total_hours.toFixed(1)} h
          <span className="ml-2 text-base font-normal text-foreground/55">
            of {progress.target_total.toFixed(0)} placeholder
          </span>
        </p>
        <p className="mt-1 text-sm text-foreground/55">
          Level {progress.current_level} · not official Ontario hours yet
        </p>
        <ul className="mt-4 space-y-3">
          {progress.levels.map((level) => {
            const pct = level.target_hours > 0 ? Math.min(100, (level.earned_hours / level.target_hours) * 100) : 0;
            return (
              <li key={level.level}>
                <div className="flex justify-between text-sm">
                  <span>{level.name}</span>
                  <span className="tabular-nums text-foreground/60">
                    {level.earned_hours.toFixed(0)} / {level.target_hours.toFixed(0)}
                  </span>
                </div>
                <div className="mt-1 h-3 overflow-hidden rounded-full bg-surface">
                  <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {error && (
        <p className="mt-5 rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-base text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-semibold text-foreground">Log hours</h2>
        <input
          type="number"
          inputMode="decimal"
          min="0.25"
          step="0.25"
          placeholder="Hours today"
          value={hours}
          onChange={(e) => setHours(e.target.value)}
          className={fieldClass}
        />
        <input
          type="text"
          placeholder="What did you work on? (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className={fieldClass}
        />
        <button type="button" disabled={busy} onClick={() => void saveHours()} className={primaryBtn}>
          {busy ? 'Saving…' : 'Save hours'}
        </button>
        <ul className="divide-y divide-border rounded-2xl border border-border">
          {dashboard.hours.length === 0 && (
            <li className="px-4 py-4 text-base text-foreground/55">No hours yet. Log your first day.</li>
          )}
          {dashboard.hours.slice(0, 8).map((entry) => (
            <li key={entry.id} className="flex justify-between gap-3 px-4 py-3 text-base">
              <span>
                {entry.worked_on}
                {entry.notes ? ` · ${entry.notes}` : ''}
              </span>
              <span className="tabular-nums">{entry.hours.toFixed(2)} h</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="text-xl font-semibold text-foreground">Ask a question</h2>
        <p className="text-base text-foreground/65">Quick jobsite question. Type or speak. We save the answer to your record.</p>
        <textarea
          rows={4}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="e.g. How do I identify the traveler on a 3-way?"
          className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-lg text-foreground placeholder:text-foreground/35 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent"
        />
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={() => (listening ? stopSpeaking() : void speakQuestion())}
            className={`flex h-14 items-center justify-center rounded-2xl border text-base font-semibold ${
              listening ? 'border-red-600 bg-red-600 text-white' : 'border-border text-foreground'
            }`}
          >
            {listening ? 'Stop' : 'Speak'}
          </button>
          <button type="button" disabled={busy} onClick={() => void ask()} className={primaryBtn}>
            {busy ? 'Asking…' : 'Ask'}
          </button>
        </div>
        {latestAnswer && (
          <div className="rounded-2xl border border-brand/20 bg-brand/5 px-4 py-4 text-base leading-relaxed text-foreground">
            {latestAnswer}
          </div>
        )}
        <ul className="space-y-3">
          {dashboard.questions.slice(0, 6).map((item) => (
            <li key={item.id} className="rounded-2xl border border-border px-4 py-4">
              <p className="text-base font-semibold text-foreground">{item.question}</p>
              <p className="mt-2 text-base leading-relaxed text-foreground/75">{item.answer}</p>
              <p className="mt-2 text-xs text-foreground/45">
                {tradeLabel(item.trade)} · {new Date(item.created_at).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function formFrom(values: Record<string, string>): FormData {
  const form = new FormData();
  for (const [key, value] of Object.entries(values)) form.set(key, value);
  return form;
}
