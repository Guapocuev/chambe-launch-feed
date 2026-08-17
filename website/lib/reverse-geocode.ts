'use server';

interface NominatimAddress {
  house_number?: string;
  road?: string;
  city?: string;
  town?: string;
  village?: string;
  suburb?: string;
  state?: string;
  postcode?: string;
}

interface NominatimReverse {
  display_name?: string;
  address?: NominatimAddress;
}

function formatSuggestion(data: NominatimReverse): string | null {
  const a = data.address;
  if (a) {
    const street = [a.house_number, a.road].filter(Boolean).join(' ');
    const city = a.city || a.town || a.village || a.suburb;
    const parts = [street, city, a.state].filter(Boolean);
    if (parts.length >= 2) return parts.join(', ');
  }
  return data.display_name?.trim() || null;
}

/** Reverse-geocode a point via Nominatim. Returns a short editable suggestion or null. */
export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  const url = new URL('https://nominatim.openstreetmap.org/reverse');
  url.searchParams.set('lat', String(lat));
  url.searchParams.set('lon', String(lng));
  url.searchParams.set('format', 'json');
  url.searchParams.set('addressdetails', '1');

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Chambe-Website/1.0 (hello@chambe.ca)',
        'Accept-Language': 'en',
      },
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as NominatimReverse;
    return formatSuggestion(data);
  } catch {
    return null;
  }
}
