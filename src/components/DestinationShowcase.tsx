import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { DESTINATIONS } from '../data/destinations';

interface DestinationShowcaseProps {
  onAddToTrip: (destId: string) => void;
}

export const DestinationShowcase: React.FC<DestinationShowcaseProps> = ({ onAddToTrip }) => {
  const [addedDestId, setAddedDestId] = useState<string | null>(null);

  const handleAdd = (destId: string) => {
    setAddedDestId(destId);
    onAddToTrip(destId);
    setTimeout(() => setAddedDestId(null), 2500);
  };

  return (
    <section
      id="destinations"
      className="relative py-20 px-6 bg-white"
      aria-label="Popular Travel Destinations"
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Popular Travel Destinations
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Explore our curated selection of beautiful destinations across India
          </p>
        </div>

        {/* Destination Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {DESTINATIONS.map((dest) => {
            const isAdded = addedDestId === dest.id;

            return (
              <article
                key={dest.id}
                className="group bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-md hover:shadow-lg transition-all duration-300 flex flex-col"
              >
                {/* Image */}
                <div className="relative w-full h-56 overflow-hidden bg-gray-100">
                  <img
                    src={dest.image}
                    alt={`${dest.name}, ${dest.state}`}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3">
                    <span className="text-xs text-white/90 bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-md">
                      {dest.state}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                      {dest.name}
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed mb-4 line-clamp-2">
                      {dest.tagline}
                    </p>
                  </div>

                  {/* Plan Trip Button */}
                  <button
                    onClick={() => handleAdd(dest.id)}
                    className={`w-full px-4 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      isAdded
                        ? 'bg-green-500 text-white'
                        : 'bg-blue-500 hover:bg-blue-600 text-white shadow-sm'
                    }`}
                    aria-label={`Plan trip to ${dest.name}`}
                  >
                    <span>{isAdded ? 'Added to Trip' : 'Plan a Trip'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};
