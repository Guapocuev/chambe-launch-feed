'use client';

import { publicPlacesKeyConfigured } from './places-payload';

/** Downtown Toronto; 55 km covers most of the GTA for locationBias. */
export const GTA_BIAS = { lat: 43.6532, lng: -79.3832, radiusMeters: 55_000 };

export interface PlaceSuggestion {
  id: string;
  label: string;
  prediction: PlacePrediction;
}

export interface SelectedPlace {
  formattedAddress: string;
  lat: number;
  lng: number;
  postalCode: string | null;
}

type PlacePrediction = {
  text?: { toString(): string } | string;
  toPlace(): {
    fetchFields(opts: { fields: string[] }): Promise<void>;
    formattedAddress?: string | null;
    location?: { lat(): number; lng(): number } | null;
    addressComponents?: Array<{ longText?: string; shortText?: string; types?: string[] }>;
  };
};

type PlacesNs = {
  AutocompleteSessionToken: new () => object;
  AutocompleteSuggestion: {
    fetchAutocompleteSuggestions(req: Record<string, unknown>): Promise<{
      suggestions: Array<{ placePrediction?: PlacePrediction }>;
    }>;
  };
};

type GoogleMaps = {
  maps?: {
    importLibrary(name: string): Promise<PlacesNs>;
  };
};

declare global {
  interface Window {
    google?: GoogleMaps;
  }
}

let placesNs: PlacesNs | null = null;
let loadPromise: Promise<PlacesNs | null> | null = null;
let sessionToken: object | null = null;

function placesKey(): string | null {
  const raw = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
  if (!publicPlacesKeyConfigured(raw)) return null;
  return raw!.trim();
}

export function placesAutocompleteAvailable(): boolean {
  return placesKey() !== null;
}

function resetSession(): void {
  sessionToken = null;
}

function ensureSession(Places: PlacesNs): object {
  if (!sessionToken) sessionToken = new Places.AutocompleteSessionToken();
  return sessionToken;
}

async function loadPlaces(): Promise<PlacesNs | null> {
  if (placesNs) return placesNs;
  if (loadPromise) return loadPromise;
  const key = placesKey();
  if (!key || typeof window === 'undefined') return null;

  loadPromise = new Promise((resolve) => {
    const finish = async () => {
      try {
        const maps = window.google?.maps;
        if (!maps?.importLibrary) {
          resolve(null);
          return;
        }
        const ns = await maps.importLibrary('places');
        placesNs = ns;
        resolve(ns);
      } catch {
        resolve(null);
      }
    };

    if (window.google?.maps?.importLibrary) {
      void finish();
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>('script[data-chambe-places="1"]');
    if (existing) {
      existing.addEventListener('load', () => void finish(), { once: true });
      existing.addEventListener('error', () => resolve(null), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.dataset.chambePlaces = '1';
    script.async = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&v=weekly&libraries=places&loading=async`;
    script.addEventListener('load', () => void finish(), { once: true });
    script.addEventListener('error', () => resolve(null), { once: true });
    document.head.appendChild(script);
  });

  return loadPromise;
}

export async function fetchPlaceSuggestions(input: string): Promise<PlaceSuggestion[] | null> {
  const trimmed = input.trim();
  if (trimmed.length < 3) return [];
  const Places = await loadPlaces();
  if (!Places) return null;

  try {
    const { suggestions } = await Places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
      input: trimmed,
      sessionToken: ensureSession(Places),
      includedRegionCodes: ['ca'],
      locationBias: {
        circle: {
          center: { lat: GTA_BIAS.lat, lng: GTA_BIAS.lng },
          radius: GTA_BIAS.radiusMeters,
        },
      },
    });

    return suggestions.flatMap((row, index) => {
      const prediction = row.placePrediction;
      if (!prediction) return [];
      const raw = prediction.text;
      const label = typeof raw === 'string' ? raw : raw?.toString?.() ?? '';
      if (!label) return [];
      return [{ id: `${index}:${label}`, label, prediction }];
    });
  } catch {
    return null;
  }
}

function postalFromComponents(
  components: Array<{ longText?: string; shortText?: string; types?: string[] }> | undefined,
): string | null {
  if (!components) return null;
  const row = components.find((part) => part.types?.includes('postal_code'));
  const value = row?.longText || row?.shortText || '';
  return value.trim() || null;
}

/** One Place Details call per selection — closes the Autocomplete session for billing. */
export async function resolvePlaceDetails(prediction: PlacePrediction): Promise<SelectedPlace | null> {
  const Places = await loadPlaces();
  if (!Places) return null;

  try {
    const place = prediction.toPlace();
    await place.fetchFields({ fields: ['formattedAddress', 'location', 'addressComponents'] });
    const lat = place.location?.lat();
    const lng = place.location?.lng();
    const formattedAddress = (place.formattedAddress ?? '').trim();
    if (!formattedAddress || lat == null || lng == null || !Number.isFinite(lat) || !Number.isFinite(lng)) {
      return null;
    }
    return {
      formattedAddress,
      lat,
      lng,
      postalCode: postalFromComponents(place.addressComponents),
    };
  } catch {
    return null;
  } finally {
    resetSession();
  }
}
