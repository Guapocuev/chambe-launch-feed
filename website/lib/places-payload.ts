/** Pure helpers for Places-selected coords on the quote form. Safe to unit-test. */

export interface PlaceCoords {
  lat: number;
  lng: number;
  postal_code: string | null;
}

export function publicPlacesKeyConfigured(raw: string | undefined): boolean {
  return typeof raw === 'string' && raw.trim().length >= 8;
}

export function parsePlaceCoordsFromForm(input: {
  lat?: string | null;
  lng?: string | null;
  postal?: string | null;
}): PlaceCoords | null {
  const latRaw = String(input.lat ?? '').trim();
  const lngRaw = String(input.lng ?? '').trim();
  if (!latRaw || !lngRaw) return null;
  const lat = Number(latRaw);
  const lng = Number(lngRaw);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  const postal = String(input.postal ?? '').trim();
  return { lat, lng, postal_code: postal || null };
}

/** If the user edits the typed address after picking a suggestion, drop stale coords. */
export function placeCoordsStillMatch(typedAddress: string, selectedFormatted: string | null): boolean {
  if (!selectedFormatted) return false;
  return typedAddress.trim() === selectedFormatted.trim();
}

export function quoteIntakePlaceFields(coords: PlaceCoords | null): {
  lat?: number;
  lng?: number;
  postal_code?: string;
} {
  if (!coords) return {};
  return {
    lat: coords.lat,
    lng: coords.lng,
    ...(coords.postal_code ? { postal_code: coords.postal_code } : {}),
  };
}
