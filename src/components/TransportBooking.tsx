import React from 'react';
import { ExternalLink, Bus, Train, Plane, Car } from 'lucide-react';
import {
  generateTransportBooking,
  getTransportModeDisplayName,
  type TransportMode,
} from '../services/transportBookingService';

interface TransportBookingProps {
  from: string;
  to: string;
  departureDate: string;
  returnDate?: string;
  selectedMode: TransportMode;
}

export const TransportBooking: React.FC<TransportBookingProps> = ({
  from,
  to,
  departureDate,
  returnDate,
  selectedMode,
}) => {
  const booking = generateTransportBooking({
    from,
    to,
    date: departureDate,
    mode: selectedMode,
    returnDate,
  });

  const getModeIcon = (mode: TransportMode) => {
    switch (mode) {
      case 'bus':
        return <Bus className="w-5 h-5" />;
      case 'train':
        return <Train className="w-5 h-5" />;
      case 'flight':
        return <Plane className="w-5 h-5" />;
      case 'car':
        return <Car className="w-5 h-5" />;
      default:
        return <Car className="w-5 h-5" />;
    }
  };

  const handlePrimaryClick = () => {
    window.open(booking.primary, '_blank', 'noopener,noreferrer');
  };

  const handleAlternativeClick = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
          {getModeIcon(selectedMode)}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Book {getTransportModeDisplayName(selectedMode)}
          </h3>
          <p className="text-sm text-gray-600">
            {from} → {to}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {/* Primary Booking Button */}
        <button
          onClick={handlePrimaryClick}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl px-6 py-3.5 font-semibold hover:from-blue-700 hover:to-blue-600 transition-all shadow-sm flex items-center justify-between group"
        >
          <span>Book Now</span>
          <ExternalLink className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
        </button>

        {/* Alternative Options */}
        {booking.alternatives.length > 0 && (
          <div className="pt-2">
            <p className="text-xs text-gray-500 font-medium mb-2">Or try these alternatives:</p>
            <div className="flex flex-wrap gap-2">
              {booking.alternatives.map((alt) => (
                <button
                  key={alt.name}
                  onClick={() => handleAlternativeClick(alt.url)}
                  className="text-xs bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-1.5"
                >
                  <span>{alt.name}</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Info Note */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
        <p className="text-xs text-blue-800">
          💡 <strong>Tip:</strong> Compare prices across multiple platforms to get the best deal!
        </p>
      </div>
    </div>
  );
};
