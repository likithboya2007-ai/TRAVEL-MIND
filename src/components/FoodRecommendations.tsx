import React from 'react';
import { UtensilsCrossed, MapPin, ChefHat, Map, Navigation } from 'lucide-react';
import { Restaurant } from '../data/destinations';
import { generateRestaurantLinks, openExternalLink } from '../services/linkGeneratorService';

interface FoodRecommendationsProps {
  destinationName: string;
  restaurants?: Restaurant[];
}

export const FoodRecommendations: React.FC<FoodRecommendationsProps> = ({
  destinationName,
  restaurants,
}) => {
  if (!restaurants || restaurants.length === 0) {
    return (
      <div className="p-6 sm:p-8 rounded-2xl bg-white border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <UtensilsCrossed className="w-6 h-6 text-blue-600" />
          <h4 className="text-lg font-semibold text-gray-900">Local Food & Cuisine</h4>
        </div>
        <p className="text-sm text-gray-600">
          Regional food recommendations are being curated for {destinationName}. 
          Check local food guides and restaurant directories when you arrive.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 rounded-2xl bg-white border border-gray-200 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <UtensilsCrossed className="w-6 h-6 text-blue-600" />
        <h4 className="text-lg font-semibold text-gray-900">
          Where to Eat in {destinationName}
        </h4>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {restaurants.map((restaurant) => (
          <div
            key={restaurant.id}
            className="p-5 rounded-xl bg-gray-50 border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all"
          >
            <div className="mb-3">
              <h5 className="font-semibold text-gray-900 text-base mb-2">
                {restaurant.name}
              </h5>
              <div className="flex items-center gap-1.5 text-sm text-gray-600 mb-2">
                <MapPin className="w-3.5 h-3.5" />
                <span>{restaurant.location}</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-gray-600">
                <ChefHat className="w-3.5 h-3.5" />
                <span>{restaurant.cuisine}</span>
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-3">{restaurant.description}</p>

            <div className="mb-3">
              <p className="text-xs font-medium text-gray-700 mb-2">Must Try:</p>
              <div className="flex flex-wrap gap-1.5">
                {restaurant.specialties.slice(0, 3).map((specialty, idx) => (
                  <span
                    key={idx}
                    className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200"
                  >
                    {specialty}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="text-sm font-semibold text-gray-900">
                    ₹{restaurant.averageCostInr.toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs text-gray-500 ml-1">for two</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                {generateRestaurantLinks(
                  restaurant.name,
                  destinationName,
                  restaurant.lat,
                  restaurant.lng
                ).map((link, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => {
                      e.stopPropagation();
                      openExternalLink(link.url);
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
                    title={link.label}
                  >
                    {link.icon === 'map' && <Map className="w-3.5 h-3.5" />}
                    {link.icon === 'directions' && <Navigation className="w-3.5 h-3.5" />}
                    <span className="hidden sm:inline">{link.label}</span>
                    <span className="sm:hidden">
                      {link.icon === 'map' ? 'Map' : 'Directions'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-4 text-xs text-gray-500">
        Prices are estimates and may vary. These restaurants serve local specialties and are popular among travelers.
      </p>
    </div>
  );
};
