'use client';

import { useEffect, useRef, useState } from 'react';
import { transcribeJobAudio } from './transcribe';

const MAX_MS = 60_000;

type Status = 'idle' | 'recording' | 'transcribing';

export function QuoteVoiceInput({
  onTranscript,
}: {
  onTranscript: (text: string) => void;
}) {
  const [supported, setSupported] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const aliveRef = useRef(true);

  useEffect(() => {
    aliveRef.current = true;
    // MediaRecorder exists only in the browser.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSupported(
      typeof navigator !== 'undefined' &&
        Boolean(navigator.mediaDevices?.getUserMedia) &&
        typeof MediaRecorder !== 'undefined',
    );
    return () => {
      aliveRef.current = false;
      stopStream();
    };
  }, []);

  function stopStream() {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    const recorder = recorderRef.current;
    recorderRef.current = null;
    if (recorder && recorder.state === 'recording') {
      recorder.stop();
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  async function start() {
    setMessage(null);
    chunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = pickMimeType();
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        void finish(recorder.mimeType || mimeType || 'audio/webm');
      };
      recorder.start(250);
      setStatus('recording');
      timeoutRef.current = window.setTimeout(() => stopRecording(), MAX_MS);
    } catch {
      stopStream();
      setStatus('idle');
      setMessage('Microphone access is needed to speak the job. You can still type it.');
    }
  }

  function stopRecording() {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    const recorder = recorderRef.current;
    if (recorder && recorder.state === 'recording') recorder.stop();
  }

  async function finish(mimeType: string) {
    const blob = new Blob(chunksRef.current, { type: mimeType });
    chunksRef.current = [];
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    recorderRef.current = null;
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (!aliveRef.current) return;

    if (blob.size < 800) {
      setStatus('idle');
      setMessage('That was too short — hold the mic and describe the job, then tap stop.');
      return;
    }

    setStatus('transcribing');
    const formData = new FormData();
    formData.append('audio', blob, filenameForMime(mimeType));
    const result = await transcribeJobAudio(formData);
    if (!aliveRef.current) return;
    setStatus('idle');
    if ('error' in result) {
      setMessage(result.error);
      return;
    }
    onTranscript(result.text);
  }

  if (!supported) return null;

  const recording = status === 'recording';
  const busy = status === 'transcribing';

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={() => (recording ? stopRecording() : void start())}
        disabled={busy}
        aria-pressed={recording}
        aria-label={recording ? 'Stop recording' : 'Speak the job description'}
        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
          recording
            ? 'border-red-600 bg-red-600 text-white'
            : 'border-border bg-background text-foreground/80 hover:border-brand hover:text-brand'
        } disabled:cursor-not-allowed disabled:opacity-60`}
      >
        <MicIcon recording={recording} />
        {busy ? 'Transcribing…' : recording ? 'Stop' : 'Speak'}
      </button>
      {message && <p className="max-w-[16rem] text-right text-xs text-red-700 dark:text-red-400">{message}</p>}
    </div>
  );
}

function pickMimeType(): string | undefined {
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type));
}

function filenameForMime(mimeType: string): string {
  if (mimeType.includes('mp4')) return 'job.m4a';
  return 'job.webm';
}

function MicIcon({ recording }: { recording: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      className="h-3.5 w-3.5"
      fill="currentColor"
      aria-hidden="true"
    >
      {recording ? (
        <rect x="6" y="6" width="8" height="8" rx="1.5" />
      ) : (
        <>
          <path d="M10 2a2.5 2.5 0 0 0-2.5 2.5v5a2.5 2.5 0 1 0 5 0v-5A2.5 2.5 0 0 0 10 2Z" />
          <path d="M5 9.5a.75.75 0 0 0-1.5 0 6.5 6.5 0 0 0 5.75 6.46V18h-2a.75.75 0 0 0 0 1.5h5.5a.75.75 0 0 0 0-1.5h-2v-2.04A6.5 6.5 0 0 0 16.5 9.5a.75.75 0 0 0-1.5 0 5 5 0 1 1-10 0Z" />
        </>
      )}
    </svg>
  );
}
