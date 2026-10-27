import React from 'react';
import { ExternalLink, Hotel } from 'lucide-react';
import { generateHotelBookingPlatforms, openExternalLink } from '../services/linkGeneratorService';

interface HotelBookingCardProps {
  destination: string;
  checkInDate?: string;
  checkOutDate?: string;
}

export const HotelBookingCard: React.FC<HotelBookingCardProps> = ({
  destination,
  checkInDate,
  checkOutDate,
}) => {
  const booking = generateHotelBookingPlatforms(destination, checkInDate, checkOutDate);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
          <Hotel className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Book Accommodation</h3>
          <p className="text-sm text-gray-600">{destination}</p>
        </div>
      </div>

      <div className="space-y-3">
        {/* Primary Booking Button */}
        <button
          onClick={() => openExternalLink(booking.primary.url)}
          className="w-full bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-xl px-6 py-3.5 font-semibold hover:from-purple-700 hover:to-purple-600 transition-all shadow-sm flex items-center justify-between group"
        >
          <span>Search on {booking.primary.name}</span>
          <ExternalLink className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
        </button>

        {/* Alternative Options */}
        <div className="pt-2">
          <p className="text-xs text-gray-500 font-medium mb-2">Compare prices on:</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
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
      <div className="mt-4 p-3 bg-purple-50 border border-purple-100 rounded-lg">
        <p className="text-xs text-purple-800">
          🏨 <strong>Tip:</strong> Book early for better deals! Check cancellation policies before confirming.
        </p>
      </div>
    </div>
  );
};
