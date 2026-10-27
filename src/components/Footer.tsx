import React from 'react';
import { Compass } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="relative bg-gray-50 text-gray-600 border-t border-gray-200 py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-gray-200">
          {/* Brand */}
          <a
            href="#"
            className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white shadow-sm">
              <Compass className="w-4 h-4 stroke-[2.5]" />
            </div>
            <span className="font-display tracking-tight text-xl">
              TravelMind AI
            </span>
          </a>

          {/* Attribution Links */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
            <a
              href="https://www.openstreetmap.org/copyright"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
            >
              OpenStreetMap
            </a>
            <a
              href="https://photon.komoot.io/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
            >
              Photon Geocoding
            </a>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <p>© {new Date().getFullYear()} TravelMind AI. All rights reserved.</p>
          <p className="text-xs text-gray-400">
            Estimates only. Please verify availability and pricing.
          </p>
        </div>
      </div>
    </footer>
  );
};
