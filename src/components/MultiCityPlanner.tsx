import React, { useState } from 'react';
import {
  MapPin,
  Calendar,
  Users,
  Sparkles,
  Loader2,
  Plus,
  X,
  ArrowUp,
  ArrowDown,
  Bookmark,
  ListChecks,
  Info,
} from 'lucide-react';
import { DESTINATIONS } from '../data/destinations';
import {
  MoodType,
  GroupType,
  EnergyType,
  GeneratedItinerary,
} from '../utils/plannerLogic';
import { generateMultiCityTrip, MultiCityTrip } from '../utils/multiCityLogic';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

interface MultiCityPlannerProps {
  onSaveTrip: (trip: GeneratedItinerary) => void;
  onAddToBucketList: (trip: GeneratedItinerary) => void;
  onClose: () => void;
}

export const MultiCityPlanner: React.FC<MultiCityPlannerProps> = ({
  onSaveTrip,
  onAddToBucketList,
  onClose,
}) => {
  const { user } = useAuth();
  const toast = useToast();

  // Form State
  const [startCity, setStartCity] = useState<string>('');
  const [cities, setCities] = useState<string[]>(['', '']);
  const [totalDays, setTotalDays] = useState<number>(7);
  const [budgetPerPerson, setBudgetPerPerson] = useState<number>(40000);
  const [travellers, setTravellers] = useState<number>(2);
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  });

  // Trip preferences
  const [mood, setMood] = useState<MoodType>('Adventure');
  const [groupType, setGroupType] = useState<GroupType>('Couple');
  const [energyLevel, setEnergyLevel] = useState<EnergyType>('Balanced');

  // Operational State
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [multiCityTrip, setMultiCityTrip] = useState<MultiCityTrip | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const availableCities = DESTINATIONS.map((d) => ({
    id: d.id,
    name: d.name,
  }));

  const handleAddCity = () => {
    if (cities.length < 4) {
      setCities([...cities, '']);
    }
  };

  const handleRemoveCity = (index: number) => {
    if (cities.length > 2) {
      const updated = cities.filter((_, i) => i !== index);
      setCities(updated);
    }
  };

  const handleCityChange = (index: number, value: string) => {
    const updated = [...cities];
    updated[index] = value;
    setCities(updated);
  };

  const handleMoveUp = (index: number) => {
    if (index > 0) {
      const updated = [...cities];
      [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
      setCities(updated);
    }
  };

  const handleMoveDown = (index: number) => {
    if (index < cities.length - 1) {
      const updated = [...cities];
      [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
      setCities(updated);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!startCity.trim()) {
      newErrors.startCity = 'Please specify your starting city.';
    }

    const validCities = cities.filter((c) => c.trim() !== '');
    if (validCities.length < 2) {
      newErrors.cities = 'Please select at least 2 destinations.';
    }

    if (totalDays < 3 || totalDays > 21) {
      newErrors.totalDays = 'Total days must be between 3 and 21.';
    }

    if (budgetPerPerson < 10000) {
      newErrors.budget = 'Minimum budget per person is ₹10,000.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsGenerating(true);
    setErrors({});

    try {
      const validCities = cities.filter((c) => c.trim() !== '');
      const trip = await generateMultiCityTrip(
        validCities,
        totalDays,
        budgetPerPerson,
        startCity,
        mood,
        groupType,
        energyLevel,
        travellers,
        startDate
      );

      setMultiCityTrip(trip);

      // Scroll to results
      setTimeout(() => {
        document.getElementById('multi-city-results')?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }, 100);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Failed to generate multi-city trip:', error);
      }
      setErrors({
        general:
          error instanceof Error
            ? error.message
            : 'Failed to generate multi-city trip. Please try again.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveLeg = (leg: MultiCityTrip['legs'][0]) => {
    onSaveTrip(leg.itinerary);
    toast.success(`${leg.city} leg saved to your trips!`);
  };

  const handleAddLegToBucket = (leg: MultiCityTrip['legs'][0]) => {
    onAddToBucketList(leg.itinerary);
    toast.success(`${leg.city} leg added to your bucket list!`);
  };

  return (
    <section className="relative py-16 px-6 bg-gray-50" aria-label="Multi-City Trip Planner">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Multi-City Trip Planner
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
              aria-label="Close multi-city planner"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <p className="text-lg text-gray-600">
            Plan a journey across 2-4 cities with seamless transport connections
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleGenerate}
          className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-sm mb-12"
        >
          {/* Starting City */}
          <div className="mb-6">
            <label htmlFor="multi-start-city" className="block text-sm font-medium text-gray-700 mb-2">
              Starting City <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                id="multi-start-city"
                type="text"
                value={startCity}
                onChange={(e) => setStartCity(e.target.value)}
                placeholder="Enter your starting city"
                className="w-full bg-white border border-gray-300 rounded-xl pl-10 pr-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-colors"
              />
            </div>
            {errors.startCity && <p className="text-red-500 text-xs mt-1.5">{errors.startCity}</p>}
          </div>

          {/* Cities List */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Destinations (2-4 cities) <span className="text-red-500">*</span>
            </label>
            <div className="space-y-3">
              {cities.map((city, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-medium text-sm">
                    {index + 1}
                  </div>
                  <div className="relative flex-1">
                    <select
                      value={city}
                      onChange={(e) => handleCityChange(index, e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-colors cursor-pointer"
                    >
                      <option value="">Select a destination</option>
                      {availableCities.map((dest) => (
                        <option key={dest.id} value={dest.name}>
                          {dest.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      aria-label="Move up"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveDown(index)}
                      disabled={index === cities.length - 1}
                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      aria-label="Move down"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                    {cities.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveCity(index)}
                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        aria-label="Remove city"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {cities.length < 4 && (
              <button
                type="button"
                onClick={handleAddCity}
                className="mt-3 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Another City</span>
              </button>
            )}
            {errors.cities && <p className="text-red-500 text-xs mt-1.5">{errors.cities}</p>}
          </div>

          {/* Trip Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
            <div>
              <label htmlFor="multi-start-date" className="block text-sm font-medium text-gray-700 mb-2">
                Start Date <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  id="multi-start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-xl pl-10 pr-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-colors"
                />
              </div>
            </div>

            <div>
              <label htmlFor="multi-total-days" className="block text-sm font-medium text-gray-700 mb-2">
                Total Days <span className="text-red-500">*</span>
              </label>
              <input
                id="multi-total-days"
                type="number"
                min="3"
                max="21"
                value={totalDays}
                onChange={(e) => setTotalDays(Number(e.target.value))}
                className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-colors"
              />
              {errors.totalDays && <p className="text-red-500 text-xs mt-1.5">{errors.totalDays}</p>}
            </div>

            <div>
              <label htmlFor="multi-travellers" className="block text-sm font-medium text-gray-700 mb-2">
                Travellers <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Users className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  id="multi-travellers"
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

          {/* Budget and Preferences */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
            <div>
              <label htmlFor="multi-budget" className="block text-sm font-medium text-gray-700 mb-2">
                Budget Per Person (₹) <span className="text-red-500">*</span>
              </label>
              <input
                id="multi-budget"
                type="number"
                min="10000"
                step="1000"
                value={budgetPerPerson}
                onChange={(e) => setBudgetPerPerson(Number(e.target.value))}
                className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-colors"
              />
              {errors.budget && <p className="text-red-500 text-xs mt-1.5">{errors.budget}</p>}
            </div>

            <div>
              <label htmlFor="multi-mood" className="block text-sm font-medium text-gray-700 mb-2">
                Travel Mood <span className="text-red-500">*</span>
              </label>
              <select
                id="multi-mood"
                value={mood}
                onChange={(e) => setMood(e.target.value as MoodType)}
                className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-colors cursor-pointer"
              >
                <option value="Adventure">Adventure</option>
                <option value="Culture">Culture</option>
                <option value="Food">Food</option>
                <option value="Photography">Photography</option>
                <option value="Romantic">Romantic</option>
                <option value="Peaceful">Peaceful</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
            <div>
              <label htmlFor="multi-group" className="block text-sm font-medium text-gray-700 mb-2">
                Group Type <span className="text-red-500">*</span>
              </label>
              <select
                id="multi-group"
                value={groupType}
                onChange={(e) => setGroupType(e.target.value as GroupType)}
                className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-colors cursor-pointer"
              >
                <option value="Solo">Solo</option>
                <option value="Couple">Couple</option>
                <option value="Friends">Friends</option>
                <option value="Family">Family</option>
              </select>
            </div>

            <div>
              <label htmlFor="multi-energy" className="block text-sm font-medium text-gray-700 mb-2">
                Energy Level <span className="text-red-500">*</span>
              </label>
              <select
                id="multi-energy"
                value={energyLevel}
                onChange={(e) => setEnergyLevel(e.target.value as EnergyType)}
                className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-colors cursor-pointer"
              >
                <option value="Relaxed">Relaxed</option>
                <option value="Balanced">Balanced</option>
                <option value="Active">Active</option>
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
                  <span>Planning Multi-City Trip...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Generate Multi-City Trip</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Results */}
        {multiCityTrip && (
          <div id="multi-city-results" className="space-y-8">
            {/* Trip Summary */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Your Multi-City Journey</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-600 mb-1">Total Duration</p>
                  <p className="font-semibold text-gray-900">{multiCityTrip.totalDays} days</p>
                </div>
                <div>
                  <p className="text-gray-600 mb-1">Total Cost</p>
                  <p className="font-semibold text-gray-900">
                    ₹{multiCityTrip.totalCost.toLocaleString('en-IN')}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 mb-1">Cities</p>
                  <p className="font-semibold text-gray-900">{multiCityTrip.legs.length} destinations</p>
                </div>
              </div>
            </div>

            {/* Legs */}
            {multiCityTrip.legs.map((leg, index) => (
              <div key={index} className="space-y-4">
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                  {/* Leg Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-full font-bold text-lg">
                          {index + 1}
                        </span>
                        <h4 className="text-2xl font-bold text-gray-900">{leg.city}</h4>
                      </div>
                      <p className="text-sm text-gray-600">
                        {leg.days} {leg.days === 1 ? 'day' : 'days'} • ₹
                        {leg.itinerary.costBreakdown.totalEstimatedInr.toLocaleString('en-IN')}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSaveLeg(leg)}
                        className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors flex items-center gap-2"
                      >
                        <Bookmark className="w-4 h-4" />
                        <span>Save</span>
                      </button>
                      <button
                        onClick={() => handleAddLegToBucket(leg)}
                        className="px-4 py-2 text-sm font-medium text-green-600 bg-green-50 rounded-xl hover:bg-green-100 transition-colors flex items-center gap-2"
                      >
                        <ListChecks className="w-4 h-4" />
                        <span>Bucket List</span>
                      </button>
                    </div>
                  </div>

                  {/* Itinerary Summary */}
                  <div className="space-y-3">
                    {leg.itinerary.days.map((day) => (
                      <div key={day.dayNumber} className="border-l-4 border-blue-200 pl-4 py-2">
                        <p className="text-sm font-semibold text-gray-900 mb-2">
                          Day {day.dayNumber} • {day.theme}
                        </p>
                        <ul className="space-y-1">
                          {day.stops.map((stop) => (
                            <li key={stop.id} className="text-sm text-gray-600">
                              • {stop.name} ({stop.category})
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Transport to Next City */}
                {leg.transportToNext && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                          <MapPin className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            Travel to {multiCityTrip.legs[index + 1]?.city}
                          </p>
                          <p className="text-xs text-gray-600">
                            {leg.transportToNext.mode.charAt(0).toUpperCase() +
                              leg.transportToNext.mode.slice(1)}{' '}
                            • {leg.transportToNext.duration}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">
                          ₹{(leg.transportToNext.estimatedCost * travellers).toLocaleString('en-IN')}
                        </p>
                        <p className="text-xs text-gray-600">for {travellers} traveller{travellers > 1 ? 's' : ''}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
