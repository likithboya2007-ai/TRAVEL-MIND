import type { GeocodedPlace } from '../types/search';

// In-memory cache for queries
const searchCache = new Map<string, GeocodedPlace[]>();

// Minimum interval between Photon network requests (rate limiting guard)
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL_MS = 600;

function formatPlaceType(osmKey?: string, osmValue?: string): string {
  if (!osmValue && !osmKey) return 'Destination';

  const v = (osmValue || osmKey || '').toLowerCase();
  const map: Record<string, string> = {
    city: 'City',
    town: 'Town',
    village: 'Village',
    island: 'Island',
    waterfall: 'Waterfall',
    peak: 'Mountain Peak',
    volcano: 'Volcano',
    beach: 'Coastal Beach',
    attraction: 'Tourist Attraction',
    monument: 'Historic Monument',
    castle: 'Castle & Fortress',
    palace: 'Palace',
    temple: 'Temple & Shrine',
    museum: 'Cultural Museum',
    ruins: 'Ancient Ruins',
    viewpoint: 'Scenic Viewpoint',
    national_park: 'National Park',
    nature_reserve: 'Nature Reserve',
    valley: 'Valley',
    lake: 'Alpine Lake',
    bay: 'Bay & Harbour',
    state: 'State / Province',
    country: 'Country',
    capital: 'Capital City',
  };

  return map[v] || v.charAt(0).toUpperCase() + v.slice(1).replace(/_/g, ' ');
}

// Known global landmarks & popular places for instant prototype reliability
const FALLBACK_POPULAR_PLACES: Record<string, GeocodedPlace[]> = {
  paris: [
    {
      id: 'fallback-paris-fr',
      name: 'Paris',
      displayName: 'Paris, Île-de-France, France',
      city: 'Paris',
      state: 'Île-de-France',
      country: 'France',
      countryCode: 'FR',
      osmValue: 'city',
      lat: 48.8566,
      lng: 2.3522,
      formattedType: 'Capital City',
    },
  ],
  'eiffel tower': [
    {
      id: 'fallback-eiffel-fr',
      name: 'Eiffel Tower',
      displayName: 'Eiffel Tower, 7th Arrondissement, Paris, France',
      city: 'Paris',
      state: 'Île-de-France',
      country: 'France',
      countryCode: 'FR',
      osmValue: 'monument',
      lat: 48.8584,
      lng: 2.2945,
      formattedType: 'Historic Monument',
    },
  ],
  munnar: [
    {
      id: 'fallback-munnar-in',
      name: 'Munnar',
      displayName: 'Munnar, Idukki District, Kerala, India',
      city: 'Munnar',
      state: 'Kerala',
      country: 'India',
      countryCode: 'IN',
      osmValue: 'town',
      lat: 10.0889,
      lng: 77.0595,
      formattedType: 'Hill Station',
    },
  ],
  bali: [
    {
      id: 'fallback-bali-id',
      name: 'Bali',
      displayName: 'Bali, Lesser Sunda Islands, Indonesia',
      state: 'Bali',
      country: 'Indonesia',
      countryCode: 'ID',
      osmValue: 'island',
      lat: -8.4095,
      lng: 115.1889,
      formattedType: 'Island',
    },
  ],
  santorini: [
    {
      id: 'fallback-santorini-gr',
      name: 'Santorini',
      displayName: 'Santorini, South Aegean, Greece',
      state: 'South Aegean',
      country: 'Greece',
      countryCode: 'GR',
      osmValue: 'island',
      lat: 36.3932,
      lng: 25.4615,
      formattedType: 'Island',
    },
  ],
  'niagara falls': [
    {
      id: 'fallback-niagara-ca',
      name: 'Niagara Falls',
      displayName: 'Niagara Falls, Ontario, Canada & New York, USA',
      state: 'Ontario',
      country: 'Canada',
      countryCode: 'CA',
      osmValue: 'waterfall',
      lat: 43.0962,
      lng: -79.0377,
      formattedType: 'Waterfall',
    },
  ],
  kyoto: [
    {
      id: 'fallback-kyoto-jp',
      name: 'Kyoto',
      displayName: 'Kyoto, Kansai Region, Japan',
      city: 'Kyoto',
      state: 'Kansai',
      country: 'Japan',
      countryCode: 'JP',
      osmValue: 'city',
      lat: 35.0116,
      lng: 135.7681,
      formattedType: 'Historic City',
    },
  ],
  zermatt: [
    {
      id: 'fallback-zermatt-ch',
      name: 'Zermatt',
      displayName: 'Zermatt, Valais, Switzerland (Matterhorn)',
      city: 'Zermatt',
      state: 'Valais',
      country: 'Switzerland',
      countryCode: 'CH',
      osmValue: 'town',
      lat: 45.9765,
      lng: 7.7491,
      formattedType: 'Alpine Village',
    },
  ],
};

export async function searchGlobalDestinations(
  query: string,
  signal?: AbortSignal
): Promise<GeocodedPlace[]> {
  const cleanQuery = query.trim();
  if (!cleanQuery || cleanQuery.length < 2) {
    return [];
  }

  const cacheKey = cleanQuery.toLowerCase();
  if (searchCache.has(cacheKey)) {
    return searchCache.get(cacheKey)!;
  }

  // Rate limiting guard
  const now = Date.now();
  const timeSinceLast = now - lastRequestTime;
  if (timeSinceLast < MIN_REQUEST_INTERVAL_MS) {
    await new Promise((r) => setTimeout(r, MIN_REQUEST_INTERVAL_MS - timeSinceLast));
  }
  lastRequestTime = Date.now();

  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(cleanQuery)}&limit=8`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6500);

    const onCallerAbort = () => controller.abort();
    if (signal) {
      signal.addEventListener('abort', onCallerAbort);
    }

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });

    clearTimeout(timeoutId);
    if (signal) {
      signal.removeEventListener('abort', onCallerAbort);
    }

    if (!response.ok) {
      throw new Error(`Photon service returned status ${response.status}`);
    }

    const data = await response.json();
    if (!data || !Array.isArray(data.features)) {
      throw new Error('Unexpected geocoding response format');
    }

    const results: GeocodedPlace[] = [];
    const seenCoordinates = new Set<string>();

    for (let i = 0; i < data.features.length; i++) {
      const feat = data.features[i];
      const props = feat.properties || {};
      const coords = feat.geometry?.coordinates;

      if (!coords || coords.length < 2) continue;

      const [lng, lat] = coords;
      const coordKey = `${lat.toFixed(3)},${lng.toFixed(3)}`;
      if (seenCoordinates.has(coordKey)) continue;
      seenCoordinates.add(coordKey);

      const name = props.name || props.city || props.country || 'Destination';
      const parts: string[] = [name];
      if (props.city && props.city !== name) parts.push(props.city);
      if (props.state && props.state !== props.city) parts.push(props.state);
      if (props.country) parts.push(props.country);

      const displayName = parts.join(', ');
      const osmValue = props.osm_value || props.osm_key;
      const formattedType = formatPlaceType(props.osm_key, props.osm_value);

      results.push({
        id: `photon-${lat.toFixed(4)}-${lng.toFixed(4)}-${i}`,
        name,
        displayName,
        city: props.city,
        state: props.state,
        country: props.country || 'International',
        countryCode: props.countrycode,
        osmType: props.osm_type,
        osmValue,
        lat,
        lng,
        formattedType,
      });
    }

    if (results.length > 0) {
      searchCache.set(cacheKey, results);
      return results;
    }

    // Check if query matches fallback popular place
    if (FALLBACK_POPULAR_PLACES[cacheKey]) {
      const fb = FALLBACK_POPULAR_PLACES[cacheKey];
      searchCache.set(cacheKey, fb);
      return fb;
    }

    return [];
  } catch (err: unknown) {
    if (signal?.aborted) {
      throw err;
    }

    console.warn(`Geocoding query "${cleanQuery}" encountered an error; checking local fallback catalog`, err);

    // If network failed or timed out, check if query matches any fallback
    if (FALLBACK_POPULAR_PLACES[cacheKey]) {
      return FALLBACK_POPULAR_PLACES[cacheKey];
    }

    // Match partial names in fallbacks
    for (const [key, places] of Object.entries(FALLBACK_POPULAR_PLACES)) {
      if (key.includes(cacheKey) || cacheKey.includes(key)) {
        return places;
      }
    }

    throw new Error('Unable to reach geographic search at this moment. Please check your connection or try another location.');
  }
}
