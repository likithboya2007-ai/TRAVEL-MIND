import { describe, it, expect } from 'vitest';
import { stripHtml, cleanTitle } from './wikimediaService';
import { searchGlobalDestinations } from './geocodingService';

describe('Search Services Unit Tests', () => {
  it('stripHtml strips nested tags and resolves standard entities', () => {
    const raw = '<a href="https://example.com">John Doe &amp; Jane</a>';
    expect(stripHtml(raw)).toBe('John Doe & Jane');
  });

  it('cleanTitle strips File: prefix and image extension', () => {
    expect(cleanTitle('File:Eiffel_Tower_Paris_Sunset.jpg')).toBe('Eiffel Tower Paris Sunset');
    expect(cleanTitle('File:Munnar_Tea_Plantations.PNG')).toBe('Munnar Tea Plantations');
  });

  it('searchGlobalDestinations returns empty array for blank or short queries', async () => {
    const emptyResult = await searchGlobalDestinations('  ');
    expect(emptyResult).toEqual([]);

    const singleLetterResult = await searchGlobalDestinations('a');
    expect(singleLetterResult).toEqual([]);
  });

  it('searchGlobalDestinations handles famous query with structured fields', async () => {
    // Tests the fallback/caching path for known destinations
    const results = await searchGlobalDestinations('Paris');
    expect(results.length).toBeGreaterThan(0);
    const first = results[0];
    expect(first.name).toBe('Paris');
    expect(first.country).toBe('France');
    expect(typeof first.lat).toBe('number');
    expect(typeof first.lng).toBe('number');
  });
});

