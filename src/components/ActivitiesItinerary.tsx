import React from 'react';
import { MapPin, Clock, Sparkles, Map, Navigation as NavigationIcon } from 'lucide-react';
import { DayPlan } from '../utils/plannerLogic';
import { generateAttractionLinks, openExternalLink } from '../services/linkGeneratorService';
import { StopVoteButtons } from './StopVoteButtons';

interface ActivitiesItineraryProps {
  days: DayPlan[];
  destinationName: string;
  hasAttractions: boolean;
  onSelectStop: (stopId: string) => void;
  selectedStopId: string | null;
  tripId?: string | null;
}

export const ActivitiesItinerary: React.FC<ActivitiesItineraryProps> = ({
  days,
  destinationName,
  hasAttractions,
  onSelectStop,
  selectedStopId,
  tripId,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-lg font-semibold text-gray-900">
          Day-by-Day Itinerary
        </h4>
        <span className="text-xs text-gray-500">
          {days.length} {days.length === 1 ? 'day' : 'days'}
        </span>
      </div>

      {!hasAttractions && (
        <div className="p-5 rounded-xl bg-blue-50 border border-blue-200 mb-4">
          <p className="text-sm text-gray-700">
            <strong>Curated attraction data available for featured destinations.</strong> 
            For {destinationName}, we've created an exploratory framework schedule. 
            You can customize your itinerary by adding specific attractions, restaurants, and places you'd like to visit.
          </p>
        </div>
      )}

      {days.map((day) => (
        <div
          key={day.dayNumber}
          className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm"
        >
          {/* Day Header */}
          <div className="p-4 sm:p-5 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                  Day {day.dayNumber}
                </span>
                <span className="text-gray-400">·</span>
                <span className="text-xs text-gray-600">{day.dateStr}</span>
              </div>
              <h5 className="font-semibold text-gray-900 text-base mt-1">{day.theme}</h5>
            </div>
            <span className="font-sans tabular-nums text-sm text-gray-600">
              Est. ₹{day.estimatedDayCostInr.toLocaleString('en-IN')}
            </span>
          </div>

          {/* Day Stops */}
          <div className="p-4 sm:p-5 space-y-3">
            {day.stops.length === 0 ? (
              <div className="py-4 px-4 rounded-xl bg-gray-50 border border-gray-200 text-sm">
                <p className="font-medium text-gray-700 mb-1">
                  No stops scheduled for this day
                </p>
                <p className="text-xs text-gray-500">
                  Add custom attractions or activities to build your personalized schedule
                </p>
              </div>
            ) : (
              day.stops.map((stop, index) => {
                const isSelected = selectedStopId === stop.id;
                return (
                  <div
                    key={stop.id}
                    onClick={() => onSelectStop(stop.id)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-blue-50 border-blue-300 shadow-sm ring-2 ring-blue-100'
                        : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
                    }`}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') onSelectStop(stop.id);
                    }}
                    aria-label={`${stop.name}. Click to view on map.`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 border border-blue-200 text-xs font-bold flex items-center justify-center shrink-0">
                          {index + 1}
                        </span>
                        <h6 className="font-semibold text-gray-900 text-sm">
                          {stop.name}
                        </h6>
                        {stop.isAIGenerated && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 border border-purple-200 rounded-full">
                            <Sparkles className="w-3 h-3" />
                            AI-suggested
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">
                          {stop.startTime} - {stop.endTime}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-gray-600 leading-relaxed mb-2">
                      {stop.description}
                    </p>

                    {/* Highlight */}
                    {stop.highlight && (
                      <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-200 text-xs text-gray-700 mb-2 flex items-start gap-2">
                        <Sparkles className="w-3.5 h-3.5 shrink-0 text-blue-600 mt-0.5" />
                        <span>{stop.highlight}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          ~{stop.durationHours} hrs
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {stop.category}
                        </span>
                      </div>
                      <span className="font-sans tabular-nums font-medium">
                        ₹{stop.estimatedCostInr}
                      </span>
                    </div>

                    {/* Voting Buttons */}
                    {tripId && (
                      <div className="pt-2 border-t border-gray-100 mt-2">
                        <StopVoteButtons tripId={tripId} stopId={stop.id} />
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 mt-3">
                      {generateAttractionLinks(
                        stop.name,
                        destinationName,
                        stop.lat,
                        stop.lng
                      ).map((link, idx) => (
                        <button
                          key={idx}
                          onClick={(e) => {
                            e.stopPropagation();
                            openExternalLink(link.url);
                          }}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
                          title={link.label}
                        >
                          {link.icon === 'map' && <Map className="w-3.5 h-3.5" />}
                          {link.icon === 'directions' && <NavigationIcon className="w-3.5 h-3.5" />}
                          <span className="hidden sm:inline">{link.label}</span>
                          <span className="sm:hidden">
                            {link.icon === 'map' ? 'Map' : 'Go'}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
