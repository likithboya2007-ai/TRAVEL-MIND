import React from 'react';
import { ExternalLink, UtensilsCrossed } from 'lucide-react';
import { generateRestaurantBookingPlatforms, openExternalLink } from '../services/linkGeneratorService';

interface RestaurantBookingCardProps {
  destination: string;
}

export const RestaurantBookingCard: React.FC<RestaurantBookingCardProps> = ({
  destination,
}) => {
  const booking = generateRestaurantBookingPlatforms(destination);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
          <UtensilsCrossed className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Reserve Tables & Order Food</h3>
          <p className="text-sm text-gray-600">{destination}</p>
        </div>
      </div>

      <div className="space-y-3">
        {/* Primary Booking Button */}
        <button
          onClick={() => openExternalLink(booking.primary.url)}
          className="w-full bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-xl px-6 py-3.5 font-semibold hover:from-orange-700 hover:to-orange-600 transition-all shadow-sm flex items-center justify-between group"
        >
          <span>Browse on {booking.primary.name}</span>
          <ExternalLink className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
        </button>

        {/* Alternative Options */}
        <div className="pt-2">
          <p className="text-xs text-gray-500 font-medium mb-2">Also check out:</p>
          <div className="grid grid-cols-2 gap-2">
            {booking.alternatives.map((alt) => (
              <button
                key={alt.name}
                onClick={() => openExternalLink(alt.url)}
                className="text-xs bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-1.5"
              >
                <span>{alt.name}</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Info Note */}
      <div className="mt-4 p-3 bg-orange-50 border border-orange-100 rounded-lg">
        <p className="text-xs text-orange-800">
          🍽️ <strong>Tip:</strong> Read reviews and check ratings before booking. Reserve tables during peak hours!
        </p>
      </div>
    </div>
  );
};
