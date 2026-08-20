'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { signPhotoUpload } from './photo-upload';

const MAX_PHOTOS = 4;
const MAX_BYTES = 8 * 1024 * 1024;
const ACCEPT = 'image/jpeg,image/png,image/webp';

type Slot = {
  localId: string;
  path: string;
  previewUrl: string;
};

function newUploadId(): string {
  return crypto.randomUUID();
}

export function QuotePhotoUpload({ onBusyChange }: { onBusyChange: (busy: boolean) => void }) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadIdRef = useRef(newUploadId());
  const slotsRef = useRef<Slot[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  slotsRef.current = slots;

  useEffect(() => {
    onBusyChange(busy);
  }, [busy, onBusyChange]);

  useEffect(() => {
    return () => {
      for (const slot of slotsRef.current) URL.revokeObjectURL(slot.previewUrl);
    };
  }, []);

  async function addFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0 || busy) return;

    const remaining = MAX_PHOTOS - slots.length;
    if (remaining <= 0) {
      setMessage(`You can attach up to ${MAX_PHOTOS} photos.`);
      return;
    }

    const picked = Array.from(fileList).slice(0, remaining);
    setMessage(null);
    setBusy(true);

    try {
      for (const file of picked) {
        if (!ACCEPT.split(',').includes(file.type)) {
          setMessage('Photos must be JPEG, PNG, or WebP.');
          continue;
        }
        if (file.size > MAX_BYTES) {
          setMessage('Each photo must be under 8 MB.');
          continue;
        }

        const signed = await signPhotoUpload(file.type, uploadIdRef.current);
        if ('error' in signed) {
          setMessage('Photos could not be uploaded right now. You can still submit without them.');
          break;
        }

        const put = await fetch(signed.signedUrl, {
          method: 'PUT',
          headers: { 'Content-Type': file.type },
          body: file,
        });
        if (!put.ok) {
          setMessage('One photo did not upload. You can try again or submit without it.');
          continue;
        }

        const previewUrl = URL.createObjectURL(file);
        setSlots((prev) =>
          prev.length >= MAX_PHOTOS
            ? prev
            : [...prev, { localId: crypto.randomUUID(), path: signed.path, previewUrl }],
        );
      }
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  function remove(localId: string) {
    setSlots((prev) => {
      const next = prev.filter((slot) => slot.localId !== localId);
      const removed = prev.find((slot) => slot.localId === localId);
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      return next;
    });
    setMessage(null);
  }

  const full = slots.length >= MAX_PHOTOS;

  return (
    <div>
      <p className="block text-sm font-medium text-foreground">Photos (optional)</p>
      <p className="mt-1 text-xs text-foreground/50">
        Up to {MAX_PHOTOS} photos. JPEG, PNG, or WebP, 8 MB each. Helps us quote more accurately.
      </p>

      {slots.map((slot) => (
        <input key={slot.localId} type="hidden" name="photo_paths" value={slot.path} readOnly />
      ))}

      {slots.length > 0 && (
        <ul className="mt-3 grid grid-cols-4 gap-2">
          {slots.map((slot) => (
            <li key={slot.localId} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={slot.previewUrl}
                alt=""
                className="h-20 w-full rounded-lg border border-border object-cover"
              />
              <button
                type="button"
                onClick={() => remove(slot.localId)}
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-xs text-background"
                aria-label="Remove photo"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      {!full && (
        <label
          htmlFor={inputId}
          className={`mt-3 flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-border bg-surface px-4 py-6 text-sm text-foreground/70 ${busy ? 'pointer-events-none opacity-60' : 'hover:border-brand hover:text-brand'}`}
        >
          {busy ? 'Uploading…' : 'Add photos'}
          <input
            id={inputId}
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            multiple
            disabled={busy}
            className="sr-only"
            onChange={(e) => void addFiles(e.target.files)}
          />
        </label>
      )}

      {message && <p className="mt-1.5 text-sm text-red-700 dark:text-red-400">{message}</p>}
    </div>
  );
}
