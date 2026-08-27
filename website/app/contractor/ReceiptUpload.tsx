'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { signPhotoUpload } from '../get-a-quote/photo-upload';

const ACCEPT = 'image/jpeg,image/png,image/webp';
const MAX_BYTES = 8 * 1024 * 1024;

export function ReceiptUpload({
  onPath,
}: {
  onPath: (path: string | null) => void;
}) {
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
    if (!file || busy) return;
    if (!ACCEPT.split(',').includes(file.type)) {
      setMessage('Receipts must be JPEG, PNG, or WebP.');
      return;
    }
    if (file.size > MAX_BYTES) {
      setMessage('Each receipt must be under 8 MB.');
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const signed = await signPhotoUpload(file.type, crypto.randomUUID());
      if ('error' in signed) {
        setMessage('Receipt could not be uploaded right now. You can still log the cost.');
        return;
      }
      const put = await fetch(signed.signedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });
      if (!put.ok) {
        setMessage('Receipt did not upload. You can still log the cost without it.');
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

  function clear() {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    onPath(null);
    setMessage(null);
  }

  return (
    <div>
      <p className="text-sm font-medium text-foreground">Receipt (optional)</p>
      {preview ? (
        <div className="relative mt-2 w-24">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="" className="h-20 w-24 rounded-lg border border-border object-cover" />
          <button
            type="button"
            onClick={clear}
            className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-xs text-background"
            aria-label="Remove receipt"
          >
            ×
          </button>
        </div>
      ) : (
        <label
          htmlFor={inputId}
          className={`mt-2 flex cursor-pointer items-center justify-center rounded-lg border border-dashed border-border bg-surface px-3 py-4 text-sm text-foreground/70 ${busy ? 'pointer-events-none opacity-60' : 'hover:border-brand hover:text-brand'}`}
        >
          {busy ? 'Uploading…' : 'Add receipt photo'}
          <input
            id={inputId}
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            disabled={busy}
            className="sr-only"
            onChange={(e) => void addFile(e.target.files)}
          />
        </label>
      )}
      {message && <p className="mt-1.5 text-sm text-red-700 dark:text-red-400">{message}</p>}
    </div>
  );
}
