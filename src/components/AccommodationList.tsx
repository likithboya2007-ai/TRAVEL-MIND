import React from 'react';
import { Hotel, MapPin, Star, Map, BedDouble } from 'lucide-react';
import { Hotel as HotelType } from '../data/destinations';
import { generateHotelLinks, openExternalLink } from '../services/linkGeneratorService';

interface AccommodationListProps {
  destinationName: string;
  hotels?: HotelType[];
  travelStyle: string;
}

export const AccommodationList: React.FC<AccommodationListProps> = ({
  destinationName,
  hotels,
  travelStyle,
}) => {
  // Filter hotels by travel style
  const filteredHotels = hotels?.filter(hotel => {
    if (travelStyle === 'Budget') return hotel.type === 'budget' || hotel.type === 'balanced';
    if (travelStyle === 'Comfortable') return hotel.type === 'balanced' || hotel.type === 'comfortable';
    return true; // Balanced shows all
  }).slice(0, 4);

  if (!filteredHotels || filteredHotels.length === 0) {
    const estimatedRange = travelStyle === 'Budget' 
      ? '₹2,000-4,000' 
      : travelStyle === 'Comfortable' 
      ? '₹5,000-10,000' 
      : '₹3,000-6,000';

    return (
      <div className="p-6 sm:p-8 rounded-2xl bg-white border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <Hotel className="w-6 h-6 text-blue-600" />
          <h4 className="text-lg font-semibold text-gray-900">
            Accommodation in {destinationName}
          </h4>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Budget-friendly hotels and guesthouses are available. 
          Estimated range for {travelStyle.toLowerCase()} travel: <strong>{estimatedRange} per night</strong>.
        </p>
        <p className="text-xs text-gray-500">
          Search on booking platforms like MakeMyTrip, Booking.com, or Airbnb for current availability.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 rounded-2xl bg-white border border-gray-200 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <Hotel className="w-6 h-6 text-blue-600" />
        <h4 className="text-lg font-semibold text-gray-900">
          Recommended Hotels in {destinationName}
        </h4>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredHotels.map((hotel) => (
          <div
            key={hotel.id}
            className="p-5 rounded-xl bg-gray-50 border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h5 className="font-semibold text-gray-900 text-base mb-1">
                  {hotel.name}
                </h5>
                <div className="flex items-center gap-1.5 text-sm text-gray-600 mb-2">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{hotel.location}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 text-sm">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="font-medium text-gray-900">{hotel.rating}</span>
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-3">{hotel.description}</p>

            <div className="flex items-center justify-between pt-3 border-t border-gray-200 mb-3">
              <div>
                <span className="text-lg font-bold text-blue-600">
                  ₹{hotel.pricePerNightInr.toLocaleString('en-IN')}
                </span>
                <span className="text-xs text-gray-500 ml-1">per night</span>
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 font-medium capitalize">
                {hotel.type}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              {generateHotelLinks(
                hotel.name,
                destinationName,
                hotel.lat,
                hotel.lng
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
                  {link.icon === 'bed' && <BedDouble className="w-3.5 h-3.5" />}
                  <span className="hidden sm:inline">{link.label}</span>
                  <span className="sm:hidden">
                    {link.icon === 'map' ? 'Map' : 'Hotels'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <p className="mt-4 text-xs text-gray-500">
        Prices are estimates based on {travelStyle.toLowerCase()} travel style. 
        Search on booking platforms for current rates and availability.
      </p>
    </div>
  );
};
