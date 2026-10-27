import React from 'react';
import { MapPin, Calendar, Thermometer, Star, Quote, Sparkles, Info } from 'lucide-react';
import { Destination } from '../data/destinations';

interface DestinationSummaryProps {
  destination: Destination;
  days: number;
  travelers: number;
}

export const DestinationSummary: React.FC<DestinationSummaryProps> = ({
  destination,
  days,
  travelers,
}) => {
  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 border border-blue-200 rounded-2xl overflow-hidden shadow-lg">
      {/* Header with Location */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-5 h-5" />
              <span className="text-sm font-medium opacity-90">{destination.state}, India</span>
            </div>
            <h2 className="text-3xl font-bold mb-2">{destination.name}</h2>
            <p className="text-blue-100 text-lg italic">{destination.tagline}</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 text-center">
            <div className="text-2xl font-bold">{days}</div>
            <div className="text-xs uppercase tracking-wide opacity-90">Days</div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Description */}
        <div>
          <p className="text-gray-700 leading-relaxed mb-4">
            {destination.description}
          </p>
          {destination.editorialQuote && (
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
              <div className="flex gap-3">
                <Quote className="w-5 h-5 text-blue-500 shrink-0 mt-1" />
                <p className="text-gray-700 italic">"{destination.editorialQuote}"</p>
              </div>
            </div>
          )}
        </div>

        {/* Quick Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Best Time to Visit */}
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-5 h-5 text-green-600" />
              <span className="text-xs font-semibold text-gray-500 uppercase">Best Time</span>
            </div>
            <p className="text-gray-900 font-medium">{destination.bestMonths}</p>
          </div>

          {/* Temperature */}
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Thermometer className="w-5 h-5 text-orange-600" />
              <span className="text-xs font-semibold text-gray-500 uppercase">Temperature</span>
            </div>
            <p className="text-gray-900 font-medium">{destination.temperature}</p>
          </div>

          {/* Trip Type */}
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <span className="text-xs font-semibold text-gray-500 uppercase">Perfect For</span>
            </div>
            <p className="text-gray-900 font-medium">
              {destination.categories.slice(0, 2).join(', ')}
            </p>
          </div>
        </div>

        {/* Highlights */}
        {destination.highlights && destination.highlights.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
              <h3 className="text-lg font-semibold text-gray-900">Top Highlights</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {destination.highlights.slice(0, 4).map((highlight, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 text-sm text-gray-700 bg-white rounded-lg px-3 py-2 border border-gray-200"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></div>
                  <span>{highlight}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Local Food */}
        {destination.localFood && destination.localFood.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">🍽️</span>
              <h3 className="text-lg font-semibold text-gray-900">Must-Try Local Cuisine</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {destination.localFood.slice(0, 6).map((food, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1.5 text-sm font-medium bg-gradient-to-r from-orange-100 to-orange-50 text-orange-800 border border-orange-200 rounded-full"
                >
                  {food}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Travel Categories */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Info className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Experience Types</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {destination.categories.map((category, idx) => {
              const categoryIcons: Record<string, string> = {
                Adventure: '🏔️',
                Culture: '🏛️',
                Nature: '🌿',
                Food: '🍴',
                Relaxation: '🧘',
                Photography: '📸',
              };
              return (
                <span
                  key={idx}
                  className="px-3 py-1.5 text-sm font-medium bg-gradient-to-r from-blue-100 to-blue-50 text-blue-800 border border-blue-200 rounded-lg flex items-center gap-1.5"
                >
                  <span>{categoryIcons[category]}</span>
                  <span>{category}</span>
                </span>
              );
            })}
          </div>
        </div>

        {/* Trip Stats */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-200">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{days}</div>
              <div className="text-xs text-gray-600 font-medium">Days</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{travelers}</div>
              <div className="text-xs text-gray-600 font-medium">Travelers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{destination.attractions?.length || 0}+</div>
              <div className="text-xs text-gray-600 font-medium">Activities</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{destination.hotels?.length || 0}+</div>
              <div className="text-xs text-gray-600 font-medium">Hotels</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
