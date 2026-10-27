import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  Calendar,
  Users,
  Sparkles,
  Loader2,
  Info,
  Search,
  Bookmark,
  ListChecks,
  Share2,
  TrendingDown,
} from 'lucide-react';
import { DESTINATIONS, Destination } from '../data/destinations';
import {
  TripInput,
  GeneratedItinerary,
  validateTripInput,
  generateTripPlan,
  MoodType,
  GroupType,
  EnergyType,
  TravelMode,
  TravelStyle,
} from '../utils/plannerLogic';
import { searchGlobalDestinations } from '../services/geocodingService';
import type { GeocodedPlace } from '../types/search';
import { TravelMap } from './TravelMap';
import { BudgetBreakdown } from './BudgetBreakdown';
import { AccommodationList } from './AccommodationList';
import { FoodRecommendations } from './FoodRecommendations';
import { ActivitiesItinerary } from './ActivitiesItinerary';
import { TransportBooking } from './TransportBooking';
import { HotelBookingCard } from './HotelBookingCard';
import { RestaurantBookingCard } from './RestaurantBookingCard';
import { DestinationSummary } from './DestinationSummary';
import { FamousFoodShowcase } from './FamousFoodShowcase';
import { ShareModal } from './ShareModal';
import { BudgetFitModal } from './BudgetFitModal';
import { InviteModal } from './InviteModal';
import { useAuth } from '../contexts/AuthContext';
import { requireAuth } from '../utils/authGate';
import { fitToBudget, BudgetFitResult } from '../utils/budgetOptimizer';
import { generateShareLink } from '../services/shareService';

interface TripPlannerProps {
  initialDestinationId?: string;
  customDestinations?: Destination[];
  currentMood: MoodType;
  currentGroup: GroupType;
  currentEnergy: EnergyType;
  onSaveTrip: (trip: GeneratedItinerary) => void;
  onAddToBucketList: (trip: GeneratedItinerary) => void;
  onTripGenerated?: (tripContext: {
    destination: string;
    days: number;
    budget: number;
    mood: string;
    currentItinerary: any;
  }) => void;
  onRegisterUpdateCallback?: (callback: (updatedDays: any) => void) => void;
}

export const TripPlanner: React.FC<TripPlannerProps> = ({
  initialDestinationId = '',
  customDestinations = [],
  currentMood,
  currentGroup,
  currentEnergy,
  onSaveTrip,
  onAddToBucketList,
  onTripGenerated,
  onRegisterUpdateCallback,
}) => {
  const { user, setShowAuthModal } = useAuth();

  // Form State
  const [startCity, setStartCity] = useState<string>('');
  const [destinationId, setDestinationId] = useState<string>(initialDestinationId);
  const [departureDate, setDepartureDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  });
  const [returnDate, setReturnDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 18);
    return d.toISOString().split('T')[0];
  });
  const [travellers, setTravellers] = useState<number>(2);
  const [budgetInr, setBudgetInr] = useState<number>(30000);
  const [travelMode, setTravelMode] = useState<TravelMode>('car');
  const [travelStyle, setTravelStyle] = useState<TravelStyle>('Balanced');
  const [mood, setMood] = useState<MoodType>(currentMood);
  const [groupType, setGroupType] = useState<GroupType>(currentGroup);
  const [energyLevel, setEnergyLevel] = useState<EnergyType>(currentEnergy);

  // Autocomplete state
  const [fromQuery, setFromQuery] = useState<string>('');
  const [toQuery, setToQuery] = useState<string>('');
  const [fromSuggestions, setFromSuggestions] = useState<GeocodedPlace[]>([]);
  const [toSuggestions, setToSuggestions] = useState<GeocodedPlace[]>([]);
  const [showFromSuggestions, setShowFromSuggestions] = useState<boolean>(false);
  const [showToSuggestions, setShowToSuggestions] = useState<boolean>(false);
  const [fromSearching, setFromSearching] = useState<boolean>(false);
  const [toSearching, setToSearching] = useState<boolean>(false);

  const fromInputRef = useRef<HTMLInputElement>(null);
  const toInputRef = useRef<HTMLInputElement>(null);
  const fromDropdownRef = useRef<HTMLDivElement>(null);
  const toDropdownRef = useRef<HTMLDivElement>(null);

  // Operational State
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [itinerary, setItinerary] = useState<GeneratedItinerary | null>(null);
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [showBudgetFitModal, setShowBudgetFitModal] = useState<boolean>(false);
  const [showInviteModal, setShowInviteModal] = useState<boolean>(false);
  const [currentTripId, setCurrentTripId] = useState<string | null>(null);
  const [budgetFitResult, setBudgetFitResult] = useState<BudgetFitResult | null>(null);

  // Update props-driven state
  useEffect(() => {
    setMood(currentMood);
  }, [currentMood]);

  useEffect(() => {
    setGroupType(currentGroup);
  }, [currentGroup]);

  useEffect(() => {
    setEnergyLevel(currentEnergy);
  }, [currentEnergy]);

  // Handle initial destination selection
  useEffect(() => {
    if (initialDestinationId) {
      setDestinationId(initialDestinationId);
      const allDests = [...(customDestinations || []), ...DESTINATIONS];
      const dest = allDests.find((d) => d.id === initialDestinationId);
      if (dest) {
        setToQuery(dest.name);
      }
    }
  }, [initialDestinationId, customDestinations]);

  // Calculate days from dates
  const days = React.useMemo(() => {
    if (!departureDate || !returnDate) return 4;
    const start = new Date(departureDate);
    const end = new Date(returnDate);
    const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(1, Math.min(14, diff));
  }, [departureDate, returnDate]);

  // Register callback for copilot to update itinerary
  useEffect(() => {
    if (onRegisterUpdateCallback) {
      const updateItinerary = (updatedDays: any[]) => {
        if (itinerary) {
          const updatedItinerary = {
            ...itinerary,
            days: updatedDays,
          };
          
          // Recalculate cost breakdown
          const activitiesCost = updatedDays.reduce(
            (sum, day) => sum + (day.estimatedDayCostInr || 0),
            0
          );
          
          updatedItinerary.costBreakdown = {
            ...updatedItinerary.costBreakdown,
            activitiesInr: activitiesCost,
            totalEstimatedInr:
              updatedItinerary.costBreakdown.stayInr +
              updatedItinerary.costBreakdown.transportInr +
              activitiesCost +
              updatedItinerary.costBreakdown.foodInr +
              updatedItinerary.costBreakdown.contingencyInr,
          };
          
          // Update variance
          updatedItinerary.costBreakdown.varianceInr =
            updatedItinerary.costBreakdown.userBudgetInr -
            updatedItinerary.costBreakdown.totalEstimatedInr;
          
          // Update budget status
          const variance = updatedItinerary.costBreakdown.varianceInr;
          updatedItinerary.costBreakdown.budgetStatus =
            variance >= 5000 ? 'comfortable' : variance >= 0 ? 'balanced' : 'tight';
          
          setItinerary(updatedItinerary);
        }
      };
      
      onRegisterUpdateCallback(updateItinerary);
    }
  }, [onRegisterUpdateCallback, itinerary]);

  // Autocomplete: From field
  useEffect(() => {
    if (fromQuery.trim().length < 2) {
      setFromSuggestions([]);
      return;
    }

    const abortController = new AbortController();
    setFromSearching(true);

    const debounce = setTimeout(async () => {
      try {
        const results = await searchGlobalDestinations(fromQuery, abortController.signal);
        setFromSuggestions(results);
      } catch (err) {
        if (import.meta.env.DEV) {
          console.error('From search error:', err);
        }
        setFromSuggestions([]);
      } finally {
        setFromSearching(false);
      }
    }, 400);

    return () => {
      clearTimeout(debounce);
      abortController.abort();
    };
  }, [fromQuery]);

  // Autocomplete: To field
  useEffect(() => {
    if (toQuery.trim().length < 2) {
      setToSuggestions([]);
      return;
    }

    const abortController = new AbortController();
    setToSearching(true);

    const debounce = setTimeout(async () => {
      try {
        const results = await searchGlobalDestinations(toQuery, abortController.signal);
        // Merge with featured destinations
        const featured = DESTINATIONS.filter((d) =>
          d.name.toLowerCase().includes(toQuery.toLowerCase())
        ).map((d) => ({
          id: d.id,
          name: d.name,
          displayName: `${d.name}, ${d.state}, India`,
          city: d.name,
          state: d.state,
          country: 'India',
          countryCode: 'IN',
          osmValue: 'city',
          lat: d.lat,
          lng: d.lng,
          formattedType: 'Featured Destination',
        }));
        setToSuggestions([...featured, ...results]);
      } catch (err) {
        if (import.meta.env.DEV) {
          console.error('To search error:', err);
        }
        setToSuggestions([]);
      } finally {
        setToSearching(false);
      }
    }, 400);

    return () => {
      clearTimeout(debounce);
      abortController.abort();
    };
  }, [toQuery]);

  // Click outside handlers
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        fromDropdownRef.current &&
        !fromDropdownRef.current.contains(event.target as Node) &&
        fromInputRef.current &&
        !fromInputRef.current.contains(event.target as Node)
      ) {
        setShowFromSuggestions(false);
      }
      if (
        toDropdownRef.current &&
        !toDropdownRef.current.contains(event.target as Node) &&
        toInputRef.current &&
        !toInputRef.current.contains(event.target as Node)
      ) {
        setShowToSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFromSelect = (place: GeocodedPlace) => {
    setFromQuery(place.city || place.name);
    setStartCity(place.city || place.name);
    setShowFromSuggestions(false);
  };

  const handleToSelect = (place: GeocodedPlace) => {
    setToQuery(place.name);
    setShowToSuggestions(false);

    // Check if it's a featured destination
    const featured = DESTINATIONS.find(
      (d) => d.name.toLowerCase() === place.name.toLowerCase()
    );

    if (featured) {
      setDestinationId(featured.id);
    } else {
      // Create custom destination
      const customDest: Destination = {
        id: `custom-${place.lat.toFixed(4)}-${place.lng.toFixed(4)}`,
        name: place.name,
        state: place.state || place.country || '',
        tagline: `Explore ${place.name}`,
        description: `Journey to ${place.displayName}`,
        editorialQuote: '',
        image: '',
        lat: place.lat,
        lng: place.lng,
        defaultDays: 4,
        suggestedBudgetInr: 30000,
        costTier: 'tier-2',
        costMultiplier: 1.0,
        categories: [],
        bestMonths: 'Year-round',
        temperature: 'Varies',
        attractions: [],
        highlights: [],
        localFood: [],
      };

      if (!customDestinations.find((d) => d.id === customDest.id)) {
        customDestinations.push(customDest);
      }
      setDestinationId(customDest.id);
    }
  };

  const handleGenerate = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const input: TripInput = {
      startCity: startCity || fromQuery,
      destinationId,
      departureDate,
      returnDate,
      days,
      travellers,
      budgetInr: Number(budgetInr),
      travelMode,
      travelStyle,
      mood,
      groupType,
      energyLevel,
    };

    const validationErrors = validateTripInput(input, customDestinations);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    setIsGenerating(true);

    setTimeout(async () => {
      try {
        const plan = await generateTripPlan(input, customDestinations);
        setItinerary(plan);
        if (plan.days[0]?.stops[0]) {
          setSelectedStopId(plan.days[0].stops[0].id);
        } else {
          setSelectedStopId(null);
        }
        
        // Notify parent about generated trip for AI copilot context
        if (onTripGenerated) {
          onTripGenerated({
            destination: `${plan.destination.name}, ${plan.destination.state}`,
            days: input.days,
            budget: input.budgetInr,
            mood: input.mood,
            currentItinerary: plan.days,
          });
        }
        
        // Scroll to results
        setTimeout(() => {
          document.getElementById('trip-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      } catch (err) {
        if (import.meta.env.DEV) {
          console.error(err);
        }
        setErrors({ general: 'Failed to generate trip plan. Please try again.' });
      } finally {
        setIsGenerating(false);
      }
    }, 500);
  };

  // Guest trip handlers: Save to localStorage
  const handleSaveTripWithAuth = (trip: GeneratedItinerary) => {
    if (!requireAuth(user, () => setShowAuthModal(true), 'save trips')) {
      // For guests, save to localStorage
      try {
        const stored = localStorage.getItem('travelmind_guest_trips');
        const guestTrips = stored ? JSON.parse(stored) : [];
        
        // Check if trip already exists
        const existingIndex = guestTrips.findIndex((t: GeneratedItinerary) => t.id === trip.id);
        
        if (existingIndex >= 0) {
          guestTrips[existingIndex] = trip;
        } else {
          guestTrips.unshift(trip);
        }
        
        localStorage.setItem('travelmind_guest_trips', JSON.stringify(guestTrips));
        console.log('Trip saved to localStorage (guest mode)');
        
        // Capture trip ID for sharing functionality
        if (trip.id) {
          setCurrentTripId(trip.id);
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('Failed to save guest trip:', error);
        }
      }
      return;
    }
    
    // User is authenticated - call parent handler
    onSaveTrip(trip);
    
    // Capture trip ID for sharing functionality
    if (trip.id) {
      setCurrentTripId(trip.id);
    }
  };

  const handleAddToBucketListWithAuth = (trip: GeneratedItinerary) => {
    if (!requireAuth(user, () => setShowAuthModal(true), 'bucket list')) {
      // For guests, save to localStorage
      try {
        const stored = localStorage.getItem('travelmind_guest_bucket');
        const guestBucket = stored ? JSON.parse(stored) : [];
        
        // Check if trip already exists
        const exists = guestBucket.some((t: GeneratedItinerary) => t.id === trip.id);
        
        if (!exists) {
          guestBucket.unshift(trip);
          localStorage.setItem('travelmind_guest_bucket', JSON.stringify(guestBucket));
          console.log('Trip added to bucket list (guest mode)');
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('Failed to add guest trip to bucket list:', error);
        }
      }
      return;
    }
    
    // User is authenticated - call parent handler
    onAddToBucketList(trip);
  };

  const handleShareTrip = () => {
    setShowShareModal(true);
  };

  const handleBudgetFit = () => {
    if (!itinerary) return;
    const result = fitToBudget(itinerary, budgetInr);
    setBudgetFitResult(result);
    setShowBudgetFitModal(true);
  };

  const handleApplyBudgetFit = () => {
    if (!budgetFitResult) return;
    setItinerary(budgetFitResult.adjustedItinerary);
    setShowBudgetFitModal(false);
    setBudgetFitResult(null);
  };

  const allStops = itinerary ? itinerary.days.flatMap((d) => d.stops) : [];
  const hasAttractions = itinerary ? itinerary.destination.attractions.length > 0 : false;

  return (
    <section id="planner" className="relative py-16 px-6 bg-gray-50" aria-label="Trip Planning Form">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Plan Your Perfect Trip
          </h2>
          <p className="text-lg text-gray-600">
            Enter your travel details below to create a personalized itinerary with budget estimates and daily activities
          </p>
        </div>

        {/* Trip Planning Form */}
        <form
          onSubmit={handleGenerate}
          className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-sm mb-12"
        >
          {/* From and To Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* From Field */}
            <div className="relative">
              <label htmlFor="from-city" className="block text-sm font-medium text-gray-700 mb-2">
                From <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  ref={fromInputRef}
                  id="from-city"
                  type="text"
                  value={fromQuery}
                  onChange={(e) => {
                    setFromQuery(e.target.value);
                    setShowFromSuggestions(true);
                  }}
                  onFocus={() => setShowFromSuggestions(true)}
                  placeholder="Enter starting city"
                  className="w-full bg-white border border-gray-300 rounded-xl pl-10 pr-10 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-colors"
                  autoComplete="off"
                />
                {fromSearching && (
                  <Loader2 className="absolute right-3 top-3 w-5 h-5 text-blue-600 animate-spin" />
                )}
              </div>
              {errors.startCity && <p className="text-red-500 text-xs mt-1.5">{errors.startCity}</p>}

              {/* From Suggestions Dropdown */}
              {showFromSuggestions && fromSuggestions.length > 0 && (
                <div
                  ref={fromDropdownRef}
                  className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-64 overflow-y-auto"
                >
                  {fromSuggestions.map((place) => (
                    <button
                      key={place.id}
                      type="button"
                      onClick={() => handleFromSelect(place)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex items-start gap-3">
                        <MapPin className="w-4 h-4 text-blue-600 mt-1 shrink-0" />
                        <div>
                          <div className="font-medium text-gray-900 text-sm">{place.name}</div>
                          <div className="text-xs text-gray-500">{place.displayName}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* To Field */}
            <div className="relative">
              <label htmlFor="to-city" className="block text-sm font-medium text-gray-700 mb-2">
                To <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  ref={toInputRef}
                  id="to-city"
                  type="text"
                  value={toQuery}
                  onChange={(e) => {
                    setToQuery(e.target.value);
                    setShowToSuggestions(true);
                  }}
                  onFocus={() => setShowToSuggestions(true)}
                  placeholder="Search destination worldwide"
                  className="w-full bg-white border border-gray-300 rounded-xl pl-10 pr-10 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-colors"
                  autoComplete="off"
                />
                {toSearching && (
                  <Loader2 className="absolute right-3 top-3 w-5 h-5 text-blue-600 animate-spin" />
                )}
              </div>
              {errors.destinationId && <p className="text-red-500 text-xs mt-1.5">{errors.destinationId}</p>}

              {/* To Suggestions Dropdown */}
              {showToSuggestions && toSuggestions.length > 0 && (
                <div
                  ref={toDropdownRef}
                  className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-64 overflow-y-auto"
                >
                  {toSuggestions.map((place) => (
                    <button
                      key={place.id}
                      type="button"
                      onClick={() => handleToSelect(place)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex items-start gap-3">
                        <MapPin className="w-4 h-4 text-blue-600 mt-1 shrink-0" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <div className="font-medium text-gray-900 text-sm">{place.name}</div>
                            {place.formattedType === 'Featured Destination' && (
                              <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                                Featured
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">{place.displayName}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Dates and Travellers */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
            <div>
              <label htmlFor="departure-date" className="block text-sm font-medium text-gray-700 mb-2">
                Departure Date <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  id="departure-date"
                  type="date"
                  value={departureDate}
                  onChange={(e) => setDepartureDate(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-xl pl-10 pr-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-colors"
                />
              </div>
              {errors.departureDate && <p className="text-red-500 text-xs mt-1.5">{errors.departureDate}</p>}
            </div>

            <div>
              <label htmlFor="return-date" className="block text-sm font-medium text-gray-700 mb-2">
                Return Date <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  id="return-date"
                  type="date"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-xl pl-10 pr-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-colors"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">{days} {days === 1 ? 'day' : 'days'}</p>
            </div>

            <div>
              <label htmlFor="travellers" className="block text-sm font-medium text-gray-700 mb-2">
                Number of Travellers <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Users className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  id="travellers"
                  type="number"
                  min="1"
                  max="10"
                  value={travellers}
                  onChange={(e) => setTravellers(Number(e.target.value))}
                  className="w-full bg-white border border-gray-300 rounded-xl pl-10 pr-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Travel Style and Mode */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
            <div>
              <label htmlFor="travel-style" className="block text-sm font-medium text-gray-700 mb-2">
                Travel Style <span className="text-red-500">*</span>
              </label>
              <select
                id="travel-style"
                value={travelStyle}
                onChange={(e) => setTravelStyle(e.target.value as TravelStyle)}
                className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-colors cursor-pointer"
              >
                <option value="Budget">Budget — Save money on accommodations and transport</option>
                <option value="Balanced">Balanced — Mix of comfort and value</option>
                <option value="Comfortable">Comfortable — Premium stays and conveniences</option>
              </select>
            </div>

            <div>
              <label htmlFor="travel-mode" className="block text-sm font-medium text-gray-700 mb-2">
                Travel Mode <span className="text-red-500">*</span>
              </label>
              <select
                id="travel-mode"
                value={travelMode}
                onChange={(e) => setTravelMode(e.target.value as TravelMode)}
                className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-colors cursor-pointer"
              >
                <option value="train">Train</option>
                <option value="bus">Bus</option>
                <option value="flight">Flight</option>
                <option value="car">Car / Taxi</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {/* Error Message */}
          {errors.general && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-start gap-2">
              <Info className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{errors.general}</span>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-center pt-4">
            <button
              type="submit"
              disabled={isGenerating}
              className="px-8 py-3.5 text-base font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 active:scale-[0.98] transition-all cursor-pointer flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Planning Your Trip...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Plan My Trip</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Results Section */}
        {itinerary && (
          <div id="trip-results" className="space-y-8">
            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-end gap-3 pb-4 border-b border-gray-200">
              <button
                onClick={() => handleSaveTripWithAuth(itinerary)}
                className="px-5 py-2.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors flex items-center gap-2"
              >
                <Bookmark className="w-4 h-4" />
                <span>Save Trip</span>
              </button>
              <button
                onClick={() => handleAddToBucketListWithAuth(itinerary)}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl hover:from-blue-700 hover:to-blue-600 transition-all shadow-sm flex items-center gap-2"
              >
                <ListChecks className="w-4 h-4" />
                <span>Add to Bucket List</span>
              </button>
              {currentTripId && (
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="px-5 py-2.5 text-sm font-medium text-purple-600 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors flex items-center gap-2"
                >
                  <Users className="w-4 h-4" />
                  <span>Invite Collaborators</span>
                </button>
              )}
              <button
                onClick={handleShareTrip}
                disabled={!currentTripId}
                className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Share2 size={20} />
                Share
              </button>
              
              {itinerary && itinerary.costBreakdown.varianceInr < 0 && (
                <button
                  onClick={handleBudgetFit}
                  className="px-6 py-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition flex items-center gap-2"
                >
                  <TrendingDown size={20} />
                  Fit to Budget
                </button>
              )}
            </div>

            {/* Destination Summary - NEW! */}
            <DestinationSummary
              destination={itinerary.destination}
              days={itinerary.input.days}
              travelers={itinerary.input.travellers}
            />

            {/* Budget Breakdown */}
            <BudgetBreakdown
              costBreakdown={itinerary.costBreakdown}
              groupType={itinerary.input.groupType}
              days={itinerary.input.days}
              travelMode={itinerary.input.travelMode}
            />

            {/* Transport Booking */}
            <TransportBooking
              from={itinerary.input.startCity}
              to={itinerary.destination.name}
              departureDate={itinerary.input.departureDate}
              returnDate={itinerary.input.returnDate}
              selectedMode={
                ['bus', 'train', 'flight', 'car'].includes(itinerary.input.travelMode)
                  ? (itinerary.input.travelMode as 'bus' | 'train' | 'flight' | 'car')
                  : 'car'
              }
            />

            {/* Booking Options Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <HotelBookingCard
                destination={itinerary.destination.name}
                checkInDate={itinerary.input.departureDate}
                checkOutDate={itinerary.input.returnDate}
              />
              <RestaurantBookingCard
                destination={itinerary.destination.name}
              />
            </div>

            {/* Accommodation */}
            <AccommodationList
              destinationName={itinerary.destination.name}
              hotels={itinerary.destination.hotels}
              travelStyle={travelStyle}
            />

            {/* Famous Food Showcase - NEW! */}
            {itinerary.destination.famousDishes && itinerary.destination.famousDishes.length > 0 && (
              <FamousFoodShowcase
                destinationName={itinerary.destination.name}
                dishes={itinerary.destination.famousDishes}
              />
            )}

            {/* Food Recommendations */}
            <FoodRecommendations
              destinationName={itinerary.destination.name}
              restaurants={itinerary.destination.restaurants}
            />

            {/* Activities & Map */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <ActivitiesItinerary
                days={itinerary.days}
                destinationName={itinerary.destination.name}
                hasAttractions={hasAttractions}
                onSelectStop={setSelectedStopId}
                selectedStopId={selectedStopId}
                tripId={currentTripId}
              />

              <div className="sticky top-24 h-fit">
                <TravelMap
                  destination={itinerary.destination}
                  stops={allStops}
                  selectedStopId={selectedStopId}
                  onSelectStop={setSelectedStopId}
                />
              </div>
            </div>
          </div>
        )}
        
        {/* Modals */}
        {itinerary && (
          <>
            <ShareModal 
              isOpen={showShareModal} 
              onClose={() => setShowShareModal(false)} 
              itinerary={itinerary} 
              tripId={currentTripId || undefined} 
            />
            {budgetFitResult && (
              <BudgetFitModal 
                isOpen={showBudgetFitModal} 
                onClose={() => setShowBudgetFitModal(false)} 
                changes={budgetFitResult.changes} 
                finalCost={budgetFitResult.finalCost} 
                targetBudget={budgetInr} 
                onApply={handleApplyBudgetFit} 
              />
            )}
            {currentTripId && (
              <InviteModal 
                isOpen={showInviteModal} 
                onClose={() => setShowInviteModal(false)} 
                tripId={currentTripId} 
              />
            )}
          </>
        )}
      </div>
    </section>
  );
};