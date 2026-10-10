'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  fetchPlaceSuggestions,
  placesAutocompleteAvailable,
  resolvePlaceDetails,
  type PlaceSuggestion,
  type SelectedPlace,
} from '@/lib/places-client';
import { placeCoordsStillMatch } from '@/lib/places-payload';

const inputClass =
  'w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-foreground/40 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand';

export interface AddressAutocompleteProps {
  id: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}

export function AddressAutocomplete({ id, name, value, onChange, placeholder }: AddressAutocompleteProps) {
  const t = useTranslations('Quote');
  const listId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [placesOn, setPlacesOn] = useState(false);
  const [selected, setSelected] = useState<SelectedPlace | null>(null);
  const requestId = useRef(0);

  const coordsLive = selected && placeCoordsStillMatch(value, selected.formattedAddress) ? selected : null;

  useEffect(() => {
    if (!placesAutocompleteAvailable()) return;
    setPlacesOn(true);
  }, []);

  useEffect(() => {
    if (!placesOn) return;
    const q = value.trim();
    if (q.length < 3) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    if (coordsLive && q === coordsLive.formattedAddress.trim()) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    const idNow = ++requestId.current;
    const timer = window.setTimeout(() => {
      void fetchPlaceSuggestions(q).then((rows) => {
        if (idNow !== requestId.current) return;
        if (rows == null) {
          setPlacesOn(false);
          setSuggestions([]);
          setOpen(false);
          return;
        }
        setSuggestions(rows);
        setHighlight(0);
        setOpen(rows.length > 0);
      });
    }, 250);

    return () => window.clearTimeout(timer);
  }, [value, placesOn, coordsLive]);

  useEffect(() => {
    function onDoc(event: MouseEvent) {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  async function pick(row: PlaceSuggestion) {
    setOpen(false);
    setSuggestions([]);
    const details = await resolvePlaceDetails(row.prediction);
    if (!details) {
      onChange(row.label);
      setSelected(null);
      return;
    }
    setSelected(details);
    onChange(details.formattedAddress);
  }

  function onTyped(next: string) {
    if (selected && !placeCoordsStillMatch(next, selected.formattedAddress)) {
      setSelected(null);
    }
    onChange(next);
  }

  return (
    <div ref={wrapRef} className="relative">
      <input
        id={id}
        name={name}
        type="text"
        autoComplete={placesOn ? 'off' : 'street-address'}
        placeholder={placeholder}
        value={value}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        onChange={(e) => onTyped(e.target.value)}
        onFocus={() => {
          if (suggestions.length > 0) setOpen(true);
        }}
        onKeyDown={(e) => {
          if (!open || suggestions.length === 0) return;
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHighlight((n) => (n + 1) % suggestions.length);
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlight((n) => (n - 1 + suggestions.length) % suggestions.length);
          } else if (e.key === 'Enter') {
            e.preventDefault();
            const row = suggestions[highlight];
            if (row) void pick(row);
          } else if (e.key === 'Escape') {
            setOpen(false);
          }
        }}
        className={`mt-1.5 ${inputClass}`}
      />
      <input type="hidden" name="place_lat" value={coordsLive ? String(coordsLive.lat) : ''} readOnly />
      <input type="hidden" name="place_lng" value={coordsLive ? String(coordsLive.lng) : ''} readOnly />
      <input type="hidden" name="place_postal" value={coordsLive?.postalCode ?? ''} readOnly />
      {placesOn && open && suggestions.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-border bg-background py-1 shadow-lg"
        >
          {suggestions.map((row, index) => (
            <li key={row.id} role="option" aria-selected={index === highlight}>
              <button
                type="button"
                className={`w-full px-3 py-2 text-left text-sm ${
                  index === highlight ? 'bg-brand/10 text-foreground' : 'text-foreground/85 hover:bg-surface'
                }`}
                onMouseEnter={() => setHighlight(index)}
                onClick={() => void pick(row)}
              >
                {row.label}
              </button>
            </li>
          ))}
        </ul>
      )}
      {placesOn && (
        <p className="mt-1.5 text-xs text-foreground/50">{t('addressSuggest')}</p>
      )}
    </div>
  );
}
