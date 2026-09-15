'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { signPhotoUpload } from '../get-a-quote/photo-upload';

const ACCEPT = 'image/jpeg,image/png,image/webp';
const MAX_BYTES = 8 * 1024 * 1024;

export function HeroPhotoUpload({
  onPath,
  disabled,
}: {
  onPath: (path: string) => void;
  disabled?: boolean;
}) {
  const t = useTranslations('Visualize');
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  async function addFile(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file || busy || disabled) return;
    if (!ACCEPT.split(',').includes(file.type)) {
      setMessage(t('useJpeg'));
      return;
    }
    if (file.size > MAX_BYTES) {
      setMessage(t('photoTooBig'));
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const signed = await signPhotoUpload(file.type, crypto.randomUUID());
      if ('error' in signed) {
        setMessage(signed.error);
        return;
      }
      const put = await fetch(signed.signedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });
      if (!put.ok) {
        setMessage(t('uploadFail'));
        return;
      }
      if (preview) URL.revokeObjectURL(preview);
      setPreview(URL.createObjectURL(file));
      onPath(signed.path);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div>
      <label htmlFor={inputId} className="text-sm font-medium text-foreground">
        {t('kitchenPhoto')}
      </label>
      <p className="mt-1 text-xs text-foreground/55">{t('kitchenPhotoHelp')}</p>
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt={t('uploadedKitchenAlt')} className="mt-3 w-full rounded-xl border border-border object-cover" />
      ) : (
        <button
          type="button"
          disabled={busy || disabled}
          onClick={() => inputRef.current?.click()}
          className="mt-3 flex w-full items-center justify-center rounded-xl border border-dashed border-border px-4 py-10 text-sm font-semibold text-foreground/70 hover:border-brand disabled:opacity-50"
        >
          {busy ? t('uploading') : t('addKitchenPhoto')}
        </button>
      )}
      <input
        id={inputId}
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        disabled={busy || disabled}
        onChange={(e) => void addFile(e.target.files)}
      />
      {message && <p className="mt-2 text-sm text-red-700 dark:text-red-300">{message}</p>}
    </div>
  );
}
