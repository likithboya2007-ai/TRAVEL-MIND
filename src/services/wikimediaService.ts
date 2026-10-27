import { PlacePhoto, PhotoAttribution, GeocodedPlace } from '../types/search';

const photoCache = new Map<string, { photos: PlacePhoto[]; description?: string; wikipediaUrl?: string }>();

// Clean HTML tags and entities from strings
export function stripHtml(input?: string): string {
  if (!input) return '';
  return input
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

// Strip file prefix (e.g. "File:Paris Eiffel Tower at sunset.jpg" -> "Paris Eiffel Tower at sunset")
export function cleanTitle(title: string): string {
  return title
    .replace(/^File:/i, '')
    .replace(/\.(jpg|jpeg|png|webp)$/i, '')
    .replace(/_/g, ' ')
    .trim();
}

// Disallow non-photographic artifacts (logos, maps, flags, diagrams, coats of arms, icons)
function isDisallowedFileName(title: string): boolean {
  const lower = title.toLowerCase();
  const disallowedTerms = [
    'logo',
    'coat_of_arms',
    'coat of arms',
    'blason',
    'wappen',
    'flag',
    'banner',
    'map',
    'carte',
    'plan',
    'diagram',
    'locator',
    'icon',
    'symbol',
    'seal',
    'emblem',
    'insignia',
    'chart',
    'graph',
    'sign',
    'sketch',
    'drawing',
    'stamp',
    'coin',
    'postage',
    '.svg',
  ];

  return disallowedTerms.some((term) => lower.includes(term));
}

export interface FetchPhotosResult {
  photos: PlacePhoto[];
  description?: string;
  wikipediaUrl?: string;
}

export async function fetchPlacePhotosAndSummary(
  place: GeocodedPlace,
  signal?: AbortSignal
): Promise<FetchPhotosResult> {
  const cacheKey = `${place.name.toLowerCase()}_${place.country.toLowerCase()}_${place.lat.toFixed(2)}`;

  if (photoCache.has(cacheKey)) {
    return photoCache.get(cacheKey)!;
  }

  let description: string | undefined;
  let wikipediaUrl: string | undefined;
  let wikipediaThumbPhoto: PlacePhoto | null = null;

  // 1. First fetch Wikipedia summary for reliable editorial description + lead official photograph
  try {
    const wikiQuery = place.name;
    const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(wikiQuery)}`;
    
    const summaryRes = await fetch(summaryUrl, {
      signal,
      headers: {
        Accept: 'application/json',
      },
    });

    if (summaryRes.ok) {
      const summaryData = await summaryRes.json();
      if (summaryData.extract && summaryData.extract.length > 20) {
        description = summaryData.extract;
      }
      if (summaryData.content_urls?.desktop?.page) {
        wikipediaUrl = summaryData.content_urls.desktop.page;
      }

      if (summaryData.thumbnail?.source && !isDisallowedFileName(summaryData.thumbnail.source)) {
        const leadImgUrl = summaryData.originalimage?.source || summaryData.thumbnail.source;
        wikipediaThumbPhoto = {
          id: `wiki-summary-${place.name.toLowerCase().replace(/\s+/g, '-')}`,
          url: leadImgUrl,
          thumbUrl: summaryData.thumbnail.source,
          width: summaryData.originalimage?.width || summaryData.thumbnail.width || 1200,
          height: summaryData.originalimage?.height || summaryData.thumbnail.height || 800,
          title: cleanTitle(summaryData.title || place.name),
          attribution: {
            artist: 'Wikipedia Contributors',
            license: 'Creative Commons (CC BY-SA)',
            licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
            sourceUrl: summaryData.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(place.name)}`,
            title: summaryData.title || place.name,
            description: summaryData.description || summaryData.extract?.slice(0, 160),
          },
          isMainCandidate: true,
        };
      }
    }
  } catch (err) {
    if (signal?.aborted) throw err;
    console.debug('Wikipedia summary request skipped or unavailable', err);
  }

  // 2. Query Wikimedia Commons MediaWiki API for high-res landscape photographs
  const photos: PlacePhoto[] = [];

  try {
    // Build contextual query: e.g. "Paris France" or "Munnar Kerala"
    const contextTerms: string[] = [place.name];
    if (place.country && place.country !== 'International' && !place.name.toLowerCase().includes(place.country.toLowerCase())) {
      contextTerms.push(place.country);
    }
    const queryTerm = contextTerms.join(' ');

    const commonsEndpoint = new URL('https://commons.wikimedia.org/w/api.php');
    commonsEndpoint.searchParams.set('action', 'query');
    commonsEndpoint.searchParams.set('generator', 'search');
    commonsEndpoint.searchParams.set('gsrsearch', `${queryTerm} -filetype:svg -logo -map`);
    commonsEndpoint.searchParams.set('gsrnamespace', '6'); // File namespace
    commonsEndpoint.searchParams.set('gsrlimit', '14');
    commonsEndpoint.searchParams.set('prop', 'imageinfo');
    commonsEndpoint.searchParams.set('iiprop', 'url|size|extmetadata');
    commonsEndpoint.searchParams.set('format', 'json');
    commonsEndpoint.searchParams.set('origin', '*');

    const res = await fetch(commonsEndpoint.toString(), { signal });
    if (res.ok) {
      const data = await res.json();
      const pages = data.query?.pages;

      if (pages && typeof pages === 'object') {
        const candidatePhotos: PlacePhoto[] = [];

        Object.values(pages).forEach((pageObj: any) => {
          const imgInfo = pageObj?.imageinfo?.[0];
          if (!imgInfo || !imgInfo.url) return;

          const title = pageObj.title || '';
          if (isDisallowedFileName(title) || isDisallowedFileName(imgInfo.url)) return;

          const width = Number(imgInfo.width) || 0;
          const height = Number(imgInfo.height) || 0;

          // Reject low-res images
          if (width < 500 || height < 300) return;

          // Filter for landscape or balanced aspect ratios:
          // aspect ratio = width / height. Reject tall banners or thin verticals
          const aspectRatio = width / height;
          if (aspectRatio < 0.8 || aspectRatio > 2.8) return;

          const ext = imgInfo.extmetadata || {};
          const rawArtist = ext.Artist?.value;
          const artist = stripHtml(rawArtist) || 'Wikimedia Commons Contributor';
          const license = ext.LicenseShortName?.value || ext.UsageTerms?.value || 'CC BY-SA / Public Domain';
          const licenseUrl = ext.LicenseUrl?.value;
          const rawDesc = ext.ImageDescription?.value;
          const descriptionText = stripHtml(rawDesc)?.slice(0, 200);

          // Use thumburl if provided, otherwise standard thumbnail sizing
          const thumbUrl = imgInfo.thumburl || imgInfo.url;

          candidatePhotos.push({
            id: `commons-${pageObj.pageid || title.replace(/\s+/g, '-')}`,
            url: imgInfo.url,
            thumbUrl,
            width,
            height,
            title: cleanTitle(title),
            attribution: {
              artist,
              license,
              licenseUrl,
              sourceUrl: imgInfo.descriptionurl || `https://commons.wikimedia.org/wiki/${encodeURIComponent(title)}`,
              title: cleanTitle(title),
              description: descriptionText,
            },
          });
        });

        // Sort by quality heuristic: prefer high resolution landscape (aspect ratio between 1.2 and 1.8)
        candidatePhotos.sort((a, b) => {
          const ratioA = a.width / a.height;
          const ratioB = b.width / b.height;
          const idealDiffA = Math.abs(ratioA - 1.5);
          const idealDiffB = Math.abs(ratioB - 1.5);

          // Give weight to resolution and ideal aspect ratio
          const scoreA = a.width - idealDiffA * 400;
          const scoreB = b.width - idealDiffB * 400;
          return scoreB - scoreA;
        });

        // Take top 6 photos
        candidatePhotos.slice(0, 6).forEach((photo) => {
          photos.push(photo);
        });
      }
    }
  } catch (err) {
    if (signal?.aborted) throw err;
    console.debug('Wikimedia Commons API query encountered an error', err);
  }

  // If Wikimedia returned photos, prepend or incorporate the Wikipedia summary photo if distinct
  if (wikipediaThumbPhoto) {
    const isDuplicate = photos.some(
      (p) => p.url === wikipediaThumbPhoto!.url || p.title.toLowerCase() === wikipediaThumbPhoto!.title.toLowerCase()
    );
    if (!isDuplicate) {
      photos.unshift(wikipediaThumbPhoto);
    }
  }

  // Ensure maximum of 6 photos
  const finalPhotos = photos.slice(0, 6);

  const result: FetchPhotosResult = {
    photos: finalPhotos,
    description,
    wikipediaUrl,
  };

  photoCache.set(cacheKey, result);
  return result;
}
