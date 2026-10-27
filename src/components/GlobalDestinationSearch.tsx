import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  MapPin,
  Compass,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Info,
  Camera,
  Image as ImageIcon,
  Check,
  AlertCircle,
  Loader2,
  X,
  Maximize2,
} from 'lucide-react';
import { GeocodedPlace, PlacePhoto, GlobalDestinationDetails } from '../types/search';
import { searchGlobalDestinations } from '../services/geocodingService';
import { fetchPlacePhotosAndSummary } from '../services/wikimediaService';

interface GlobalDestinationSearchProps {
  onSelectPlaceForTrip: (place: GeocodedPlace, photoUrl?: string, details?: GlobalDestinationDetails) => void;
  selectedPlaceId?: string;
}

const POPULAR_SEARCH_IDEAS = [
  { label: 'Paris', query: 'Paris' },
  { label: 'Eiffel Tower', query: 'Eiffel Tower' },
  { label: 'Munnar', query: 'Munnar' },
  { label: 'Bali', query: 'Bali' },
  { label: 'Santorini', query: 'Santorini' },
  { label: 'Niagara Falls', query: 'Niagara Falls' },
  { label: 'Kyoto', query: 'Kyoto' },
  { label: 'Zermatt', query: 'Zermatt' },
];

export const GlobalDestinationSearch: React.FC<GlobalDestinationSearchProps> = ({
  onSelectPlaceForTrip,
  selectedPlaceId,
}) => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<GeocodedPlace[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  // Selected Place Details State
  const [activePlace, setActivePlace] = useState<GeocodedPlace | null>(null);
  const [placeDetails, setPlaceDetails] = useState<GlobalDestinationDetails | null>(null);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);
  const [isAddedToTrip, setIsAddedToTrip] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);

  // Monotonic sequence counters to prevent async race conditions
  const searchRequestIdRef = useRef(0);
  const photoRequestIdRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastExecutedQueryRef = useRef('');

  // Clean up ongoing fetches on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Debounced live search when user types 3 or more characters
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 3) {
      if (trimmed.length === 0) {
        setCandidates([]);
        setSearchError(null);
      }
      return;
    }

    if (trimmed.toLowerCase() === lastExecutedQueryRef.current.toLowerCase()) {
      return;
    }

    const timer = setTimeout(() => {
      handleSearchSubmit(undefined, trimmed);
    }, 450);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSearchSubmit = async (e?: React.FormEvent, customQuery?: string) => {
    if (e) e.preventDefault();
    const searchTerm = (customQuery !== undefined ? customQuery : query).trim();
    if (!searchTerm || searchTerm.length < 2) {
      setSearchError('Please enter at least 2 characters to search.');
      return;
    }

    // Abort previous in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    lastExecutedQueryRef.current = searchTerm;
    const currentSeq = ++searchRequestIdRef.current;
    setIsSearching(true);
    setSearchError(null);
    setHasSearched(true);
    setFocusedIndex(0);

    try {
      const places = await searchGlobalDestinations(searchTerm, controller.signal);

      // Verify sequence hasn't been superseded
      if (currentSeq !== searchRequestIdRef.current) return;

      setCandidates(places);
      setFocusedIndex(0);
      if (places.length === 0) {
        setSearchError(`No geographic matches found for "${searchTerm}". Try a different spelling or broader location.`);
      } else {
        // Automatically fetch photos for top match
        handleSelectCandidate(places[0]);
      }
    } catch (err: any) {
      if (currentSeq !== searchRequestIdRef.current) return;
      if (err.name === 'AbortError') return;
      setSearchError(err.message || 'Geographic search failed. Please try again.');
      setCandidates([]);
    } finally {
      if (currentSeq === searchRequestIdRef.current) {
        setIsSearching(false);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (candidates.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex((prev) => (prev + 1) % candidates.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex((prev) => (prev - 1 + candidates.length) % candidates.length);
    } else if (e.key === 'Enter') {
      if (candidates[focusedIndex]) {
        e.preventDefault();
        handleSelectCandidate(candidates[focusedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setCandidates([]);
    }
  };

  const handleSelectCandidate = async (place: GeocodedPlace) => {
    setActivePlace(place);
    setSelectedPhotoIndex(0);
    setIsAddedToTrip(false);

    const currentPhotoSeq = ++photoRequestIdRef.current;

    // Set initial loading details state
    setPlaceDetails({
      place,
      photos: [],
      selectedPhoto: null,
      isLoadingPhotos: true,
      photoError: null,
    });

    try {
      const result = await fetchPlacePhotosAndSummary(place);

      // Ensure no newer place selection overtook this one
      if (currentPhotoSeq !== photoRequestIdRef.current) return;

      const mainPhoto = result.photos.length > 0 ? result.photos[0] : null;

      setPlaceDetails({
        place,
        description: result.description,
        wikipediaUrl: result.wikipediaUrl,
        photos: result.photos,
        selectedPhoto: mainPhoto,
        isLoadingPhotos: false,
        photoError: result.photos.length === 0 ? 'No verified photographs found on Wikimedia Commons for this place.' : null,
      });
    } catch (err: any) {
      if (currentPhotoSeq !== photoRequestIdRef.current) return;
      setPlaceDetails({
        place,
        photos: [],
        selectedPhoto: null,
        isLoadingPhotos: false,
        photoError: 'Could not retrieve Wikimedia Commons photographs at this time.',
      });
    }
  };

  const handleApplyToTrip = () => {
    if (!activePlace) return;
    const currentPhoto = placeDetails?.photos[selectedPhotoIndex]?.url || placeDetails?.selectedPhoto?.url;
    onSelectPlaceForTrip(activePlace, currentPhoto, placeDetails || undefined);
    setIsAddedToTrip(true);

    // Smooth scroll down to planner
    setTimeout(() => {
      const plannerElem = document.getElementById('planner');
      if (plannerElem) {
        plannerElem.scrollIntoView({ behavior: 'smooth' });
      }
    }, 150);
  };

  const activePhoto = placeDetails?.photos[selectedPhotoIndex] || null;

  return (
    <section id="search" className="relative py-28 px-6 bg-[#050811] text-slate-100 border-b border-slate-800/80" aria-label="Scene 5: Global Destination Search">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="max-w-3xl mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-300 text-xs font-mono uppercase tracking-widest mb-4">
            <Compass className="w-3.5 h-3.5 text-teal-400" />
            <span>Scene 05 · Global Destination Search &amp; Verified Photography</span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">
            Where do you want to go?
          </h2>
          <p className="text-slate-300 text-base sm:text-lg leading-relaxed">
            Search cities, ancient temples, coastal islands, waterfalls, and alpine valleys worldwide. We resolve precise coordinates via OpenStreetMap and retrieve genuine, high-resolution photographs directly from Wikimedia Commons.
          </p>
        </div>

        {/* --- SEARCH BAR --- */}
        <div className="max-w-3xl mb-6">
          <form
            onSubmit={(e) => handleSearchSubmit(e)}
            className="relative flex items-center bg-[#090f20]/95 border border-slate-800 rounded-2xl p-2 shadow-2xl focus-within:border-teal-400/80 transition-all"
          >
            <div className="pl-4 pr-2 text-slate-400">
              <Search className="w-5 h-5 text-teal-400" />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Where do you want to go?"
              aria-label="Where do you want to go?"
              role="combobox"
              aria-expanded={candidates.length > 0}
              aria-controls="destination-candidates"
              aria-autocomplete="list"
              className="w-full bg-transparent border-0 text-white placeholder-slate-500 text-base sm:text-lg px-2 py-3 focus:outline-none focus:ring-0"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setCandidates([]);
                  setSearchError(null);
                }}
                className="p-2 text-slate-400 hover:text-white transition-colors cursor-pointer"
                aria-label="Clear search input"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              type="submit"
              disabled={isSearching}
              className="ml-2 px-6 py-3 bg-gradient-to-r from-teal-400 via-teal-300 to-cyan-400 hover:from-teal-300 hover:to-cyan-300 text-slate-950 font-bold text-sm rounded-xl transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 shrink-0 shadow-lg shadow-teal-500/20"
            >
              {isSearching ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <span>Search</span>
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Search Suggestions */}
          <div className="flex flex-wrap items-center gap-2 mt-3 text-xs text-neutral-400">
            <span className="font-mono text-neutral-500 uppercase tracking-wider">Try:</span>
            {POPULAR_SEARCH_IDEAS.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => {
                  setQuery(item.query);
                  handleSearchSubmit(undefined, item.query);
                }}
                className="px-2.5 py-1 rounded-md bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-teal-300 hover:border-teal-500/40 transition-colors cursor-pointer"
              >
                {item.label}
              </button>
            ))}
          </div>

          {searchError && (
            <div className="mt-4 p-4 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-sm flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-red-200">Search Notice</p>
                  <p className="text-xs text-red-300/90 mt-0.5">{searchError}</p>
                </div>
              </div>
              {query.trim().length >= 2 && (
                <button
                  type="button"
                  onClick={() => handleSearchSubmit(undefined, query.trim())}
                  className="px-3 py-1.5 rounded-lg bg-red-900/60 hover:bg-red-800 text-xs font-semibold text-red-200 border border-red-700/80 transition-colors shrink-0 cursor-pointer flex items-center gap-1.5"
                >
                  <span>Retry</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* --- CANDIDATE MATCHES LIST (WHEN MULTIPLE FOUND) --- */}
        {candidates.length > 1 && (
          <div className="mb-10 max-w-4xl">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-mono uppercase tracking-wider text-neutral-400">
                Matching Locations ({candidates.length}) · Use ↑ ↓ arrow keys or click to select
              </p>
              <span className="text-[11px] font-mono text-slate-500 hidden sm:inline">
                Enter to confirm
              </span>
            </div>
            <div
              id="destination-candidates"
              role="listbox"
              aria-label="Matching destination candidates"
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3"
            >
              {candidates.map((c, idx) => {
                const isSelected = activePlace?.id === c.id;
                const isFocused = idx === focusedIndex;
                return (
                  <button
                    key={c.id}
                    id={`candidate-item-${c.id}`}
                    role="option"
                    aria-selected={isSelected}
                    tabIndex={0}
                    onMouseEnter={() => setFocusedIndex(idx)}
                    onClick={() => {
                      setFocusedIndex(idx);
                      handleSelectCandidate(c);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleSelectCandidate(c);
                      }
                    }}
                    className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer focus:outline-none ${
                      isSelected
                        ? 'bg-teal-950/40 border-teal-500/80 shadow-md shadow-teal-500/10'
                        : isFocused
                        ? 'bg-[#0c142b] border-teal-400/60 ring-2 ring-teal-400/20'
                        : 'bg-[#090f20]/70 border-slate-800 hover:border-slate-700 hover:bg-[#0c142b]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-semibold text-sm text-white truncate">{c.name}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-teal-300 shrink-0">
                        {c.formattedType}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-1">
                      {c.state ? `${c.state}, ` : ''}{c.country}
                    </p>
                    <div className="flex items-center gap-2 mt-2 text-[10px] font-mono text-slate-500">
                      <span>{c.lat.toFixed(2)}°, {c.lng.toFixed(2)}°</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* --- SELECTED DESTINATION SHOWCASE CARD --- */}
        {activePlace && placeDetails && (
          <div className="max-w-5xl rounded-3xl bg-[#090f20]/90 border border-slate-800 overflow-hidden shadow-2xl transition-all">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
              {/* Photo Viewport (7 cols) */}
              <div className="lg:col-span-7 relative bg-[#050811] min-h-[360px] sm:min-h-[440px] flex items-center justify-center overflow-hidden group">
                {placeDetails.isLoadingPhotos ? (
                  <div className="flex flex-col items-center justify-center p-8 text-center space-y-3">
                    <Loader2 className="w-8 h-8 text-teal-400 animate-spin" />
                    <p className="text-sm font-medium text-slate-300">Searching Wikimedia Commons photographic archives...</p>
                    <p className="text-xs text-slate-500 max-w-xs">Filtering genuine landscape photographs, excluding icons and banners.</p>
                  </div>
                ) : activePhoto ? (
                  <>
                    <img
                      src={activePhoto.url}
                      alt={activePhoto.title}
                      className="w-full h-full object-cover max-h-[500px] transition-transform duration-700 ease-out group-hover:scale-105"
                      loading="lazy"
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (activePhoto.thumbUrl && target.src !== activePhoto.thumbUrl) {
                          target.src = activePhoto.thumbUrl;
                        } else {
                          target.src = '/src/assets/images/dest_goa_1792602056666.jpg';
                        }
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/20 to-transparent pointer-events-none" />

                    {/* Expand Gallery Trigger */}
                    {placeDetails.photos.length > 1 && (
                      <button
                        onClick={() => setIsGalleryModalOpen(true)}
                        className="absolute top-4 right-4 px-3 py-1.5 rounded-lg bg-neutral-950/80 hover:bg-neutral-900 border border-neutral-700/80 text-xs font-medium text-neutral-200 flex items-center gap-1.5 backdrop-blur-md transition-colors cursor-pointer shadow-lg"
                        aria-label="View photo gallery"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                        <span>Gallery ({placeDetails.photos.length})</span>
                      </button>
                    )}

                    {/* Bottom Photo Caption & License */}
                    <div className="absolute bottom-4 left-4 right-4 bg-neutral-950/85 backdrop-blur-md rounded-xl p-3 border border-neutral-800 text-xs text-neutral-300">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-medium text-white truncate">{activePhoto.title}</span>
                        <a
                          href={activePhoto.attribution.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-teal-400 hover:text-teal-300 flex items-center gap-1 shrink-0 cursor-pointer"
                        >
                          <span>Wikimedia</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-2 text-[11px] text-neutral-400">
                        <span>Photo: {activePhoto.attribution.artist || 'Wikimedia Contributor'}</span>
                        <span aria-hidden="true">·</span>
                        {activePhoto.attribution.licenseUrl ? (
                          <a
                            href={activePhoto.attribution.licenseUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-neutral-300 hover:text-teal-300 underline underline-offset-2"
                          >
                            {activePhoto.attribution.license}
                          </a>
                        ) : (
                          <span>{activePhoto.attribution.license}</span>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="p-8 text-center max-w-sm space-y-3">
                    <Camera className="w-10 h-10 text-neutral-600 mx-auto" />
                    <p className="text-sm font-semibold text-neutral-300">No Verified Photo Found</p>
                    <p className="text-xs text-neutral-400 leading-relaxed">
                      No verified public photographic records were retrieved from Wikimedia Commons for this location. We do not generate artificial scenery.
                    </p>
                  </div>
                )}
              </div>

              {/* Details & Actions (5 cols) */}
              <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-teal-500/15 border border-teal-500/30 text-teal-300 text-xs font-mono font-medium">
                      {activePlace.formattedType}
                    </span>
                    <span className="text-xs text-neutral-500 font-mono">
                      {activePlace.lat.toFixed(4)}°, {activePlace.lng.toFixed(4)}°
                    </span>
                  </div>

                  <h3 className="font-display text-2xl sm:text-3xl font-bold text-white mb-2">
                    {activePlace.name}
                  </h3>
                  <p className="text-sm text-neutral-400 mb-4">
                    {activePlace.city && activePlace.city !== activePlace.name ? `${activePlace.city}, ` : ''}
                    {activePlace.state ? `${activePlace.state}, ` : ''}
                    {activePlace.country}
                  </p>

                  {/* Editorial Extract / Description */}
                  {placeDetails.description && (
                    <div className="mb-6 p-4 rounded-xl bg-neutral-950/60 border border-neutral-800/80">
                      <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed line-clamp-4">
                        {placeDetails.description}
                      </p>
                      {placeDetails.wikipediaUrl && (
                        <a
                          href={placeDetails.wikipediaUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-teal-400 hover:text-teal-300 font-medium mt-2.5"
                        >
                          <span>Read full article on Wikipedia</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  )}

                  {/* Thumbnail Row (when > 1 photo available) */}
                  {placeDetails.photos.length > 1 && (
                    <div className="mb-6">
                      <p className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider mb-2">
                        Wikimedia Gallery ({placeDetails.photos.length} photos)
                      </p>
                      <div className="flex items-center gap-2 overflow-x-auto pb-2">
                        {placeDetails.photos.map((p, idx) => (
                          <button
                            key={p.id}
                            onClick={() => setSelectedPhotoIndex(idx)}
                            className={`relative w-16 h-12 rounded-lg overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                              idx === selectedPhotoIndex
                                ? 'border-teal-400 ring-2 ring-teal-400/30'
                                : 'border-neutral-800 hover:border-neutral-600 opacity-70 hover:opacity-100'
                            }`}
                          >
                            <img
                              src={p.thumbUrl || p.url}
                              alt={p.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src = '/src/assets/images/dest_goa_1792602056666.jpg';
                              }}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Primary CTA */}
                <div className="pt-4 border-t border-neutral-800 space-y-3">
                  <button
                    onClick={handleApplyToTrip}
                    className="w-full py-3.5 px-6 rounded-xl bg-teal-500 hover:bg-teal-400 text-neutral-950 font-bold text-sm tracking-wide transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xl shadow-teal-500/20"
                  >
                    {isAddedToTrip ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Loaded into Trip Planner</span>
                      </>
                    ) : (
                      <>
                        <Compass className="w-4 h-4" />
                        <span>Plan Journey to {activePlace.name}</span>
                        <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                  <p className="text-[11px] text-neutral-500 text-center">
                    Updates trip coordinates, centers map, and generates personalized seasonal weather forecast.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- FULL GALLERY MODAL --- */}
        {isGalleryModalOpen && placeDetails && placeDetails.photos.length > 0 && (
          <div className="fixed inset-0 z-50 bg-neutral-950/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-8">
            <div className="relative w-full max-w-4xl max-h-[90vh] bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden flex flex-col shadow-2xl">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b border-neutral-800">
                <div>
                  <h4 className="font-display font-bold text-white text-lg">
                    {activePlace?.name} Photographic Archives
                  </h4>
                  <p className="text-xs text-neutral-400">
                    Sourced from Wikimedia Commons · {placeDetails.photos.length} Verified Photos
                  </p>
                </div>
                <button
                  onClick={() => setIsGalleryModalOpen(false)}
                  className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
                  aria-label="Close gallery modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-6">
                <div className="relative rounded-xl overflow-hidden bg-neutral-950 max-h-[50vh] flex items-center justify-center">
                  <img
                    src={placeDetails.photos[selectedPhotoIndex].url}
                    alt={placeDetails.photos[selectedPhotoIndex].title}
                    className="max-h-[50vh] w-auto object-contain"
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (placeDetails.photos[selectedPhotoIndex].thumbUrl && target.src !== placeDetails.photos[selectedPhotoIndex].thumbUrl) {
                        target.src = placeDetails.photos[selectedPhotoIndex].thumbUrl;
                      } else {
                        target.src = '/src/assets/images/dest_goa_1792602056666.jpg';
                      }
                    }}
                  />
                </div>

                {/* Attribution Box */}
                <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 text-xs space-y-1.5">
                  <p className="font-semibold text-white text-sm">
                    {placeDetails.photos[selectedPhotoIndex].title}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-3 text-neutral-400">
                    <span>Creator: {placeDetails.photos[selectedPhotoIndex].attribution.artist || 'Wikimedia Contributor'}</span>
                    <span>License: {placeDetails.photos[selectedPhotoIndex].attribution.license}</span>
                    <a
                      href={placeDetails.photos[selectedPhotoIndex].attribution.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-teal-400 hover:text-teal-300 underline flex items-center gap-1"
                    >
                      <span>Wikimedia Commons File Page</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                {/* Thumbnails Grid */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                  {placeDetails.photos.map((photo, idx) => (
                    <button
                      key={photo.id}
                      onClick={() => setSelectedPhotoIndex(idx)}
                      className={`relative aspect-[4/3] rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                        idx === selectedPhotoIndex
                          ? 'border-teal-400 ring-2 ring-teal-400/40'
                          : 'border-neutral-800 hover:border-neutral-700 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={photo.thumbUrl || photo.url}
                        alt={photo.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = '/src/assets/images/dest_goa_1792602056666.jpg';
                        }}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
