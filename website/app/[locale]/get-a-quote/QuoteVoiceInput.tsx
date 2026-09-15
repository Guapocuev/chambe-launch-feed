'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { transcribeJobAudio } from './transcribe';

const MAX_MS = 60_000;

type Status = 'idle' | 'recording' | 'transcribing';

type BrowserSpeechRecognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult:
    | ((event: {
        resultIndex: number;
        results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>;
      }) => void)
    | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
};

export function QuoteVoiceInput({
  onTranscript,
}: {
  onTranscript: (text: string) => void;
}) {
  const t = useTranslations('Quote');
  const locale = useLocale();
  const [supported, setSupported] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const speechRef = useRef<BrowserSpeechRecognition | null>(null);
  const speechTextRef = useRef('');
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const aliveRef = useRef(true);

  useEffect(() => {
    aliveRef.current = true;
    // MediaRecorder / Web Speech exist only in the browser.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSupported(
      typeof navigator !== 'undefined' &&
        Boolean(navigator.mediaDevices?.getUserMedia) &&
        (typeof MediaRecorder !== 'undefined' || Boolean(speechRecognitionCtor())),
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
    const speech = speechRef.current;
    speechRef.current = null;
    if (speech) {
      speech.onresult = null;
      speech.onerror = null;
      speech.onend = null;
      try {
        speech.abort();
      } catch {
        // already stopped
      }
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
    speechTextRef.current = '';
    const Speech = speechRecognitionCtor();
    if (Speech && locale === 'en') {
      startBrowserSpeech(Speech);
      return;
    }
    await startMediaRecorder();
  }

  function startBrowserSpeech(Speech: new () => BrowserSpeechRecognition) {
    const rec = new Speech();
    rec.lang = 'en-CA';
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (event) => {
      let finalText = speechTextRef.current;
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const piece = event.results[i][0]?.transcript ?? '';
        if (event.results[i].isFinal) finalText += `${piece} `;
      }
      speechTextRef.current = finalText;
    };
    rec.onerror = (event) => {
      if (!aliveRef.current) return;
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        stopStream();
        setStatus('idle');
        setMessage(t('voiceMic'));
        return;
      }
      if (event.error === 'no-speech' || event.error === 'aborted') {
        return;
      }
      // Chrome's recognizer talks to Google; if that path dies, fall back to
      // the recorded-audio + Whisper action (which may itself be out of credits).
      rec.onend = null;
      stopStream();
      void startMediaRecorder();
    };
    rec.onend = () => {
      if (!aliveRef.current) return;
      if (speechRef.current !== rec) return;
      speechRef.current = null;
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      const text = speechTextRef.current.replace(/\s+/g, ' ').trim();
      setStatus('idle');
      if (text) {
        onTranscript(text);
        return;
      }
      setMessage(t('voiceNoSpeech'));
    };
    speechRef.current = rec;
    rec.start();
    setStatus('recording');
    timeoutRef.current = window.setTimeout(() => stopRecording(), MAX_MS);
  }

  async function startMediaRecorder() {
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
      setMessage(t('voiceMic'));
    }
  }

  function stopRecording() {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    const speech = speechRef.current;
    if (speech) {
      try {
        speech.stop();
      } catch {
        // already stopped
      }
      return;
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
      setMessage(t('voiceTooShort'));
      return;
    }

    setStatus('transcribing');
    const formData = new FormData();
    formData.append('audio', blob, filenameForMime(mimeType));
    formData.append('locale', locale);
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
        aria-label={recording ? t('voiceStop') : t('voiceSpeak')}
        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
          recording
            ? 'border-red-600 bg-red-600 text-white'
            : 'border-border bg-background text-foreground/80 hover:border-brand hover:text-brand'
        } disabled:cursor-not-allowed disabled:opacity-60`}
      >
        <MicIcon recording={recording} />
        {busy ? t('voiceTranscribing') : recording ? t('voiceStopShort') : t('voiceSpeakShort')}
      </button>
      {message && <p className="max-w-[16rem] text-right text-xs text-red-700 dark:text-red-400">{message}</p>}
    </div>
  );
}

function speechRecognitionCtor(): (new () => BrowserSpeechRecognition) | undefined {
  if (typeof window === 'undefined') return undefined;
  const w = window as Window & {
    SpeechRecognition?: new () => BrowserSpeechRecognition;
    webkitSpeechRecognition?: new () => BrowserSpeechRecognition;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

function pickMimeType(): string | undefined {
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type));
}

function filenameForMime(mimeType: string): string {
  if (mimeType.includes('wav')) return 'job.wav';
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
