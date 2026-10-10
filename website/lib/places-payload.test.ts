import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  parsePlaceCoordsFromForm,
  placeCoordsStillMatch,
  publicPlacesKeyConfigured,
  quoteIntakePlaceFields,
} from './places-payload.ts';

describe('publicPlacesKeyConfigured', () => {
  it('is false when the key is missing or tiny', () => {
    assert.equal(publicPlacesKeyConfigured(undefined), false);
    assert.equal(publicPlacesKeyConfigured(''), false);
    assert.equal(publicPlacesKeyConfigured('   '), false);
    assert.equal(publicPlacesKeyConfigured('short'), false);
  });

  it('is true for a non-empty restricted browser key (value not logged)', () => {
    assert.equal(publicPlacesKeyConfigured('AIzaSyDummyKeyForUnitTestsOnly'), true);
  });
});

describe('Places-selected path', () => {
  it('parses lat/lng/postal from the form and includes them on the intake payload', () => {
    const coords = parsePlaceCoordsFromForm({
      lat: '43.6612',
      lng: '-79.4248',
      postal: 'M6H 1Y5',
    });
    assert.deepEqual(coords, { lat: 43.6612, lng: -79.4248, postal_code: 'M6H 1Y5' });
    assert.deepEqual(quoteIntakePlaceFields(coords), {
      lat: 43.6612,
      lng: -79.4248,
      postal_code: 'M6H 1Y5',
    });
  });
});

describe('fallback path (typed address, no Places selection)', () => {
  it('returns null coords so the engine falls back to Nominatim', () => {
    assert.equal(parsePlaceCoordsFromForm({ lat: '', lng: '', postal: '' }), null);
    assert.equal(parsePlaceCoordsFromForm({}), null);
    assert.equal(parsePlaceCoordsFromForm({ lat: 'not-a-number', lng: '-79.4' }), null);
    assert.deepEqual(quoteIntakePlaceFields(null), {});
  });

  it('clears coords when the user edits the address after a pick', () => {
    assert.equal(placeCoordsStillMatch('121 Lappin Avenue, Toronto', '121 Lappin Avenue, Toronto'), true);
    assert.equal(placeCoordsStillMatch('121 Lappin Avenu', '121 Lappin Avenue, Toronto'), false);
  });
});
