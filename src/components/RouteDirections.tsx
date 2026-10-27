import React, { useState } from 'react';
import {
  Navigation,
  TrendingUp,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  CornerDownLeft,
  CornerDownRight,
  MapPin,
  Clock,
  RouteIcon,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from 'lucide-react';
import { TurnByTurnDirection } from '../services/routingService';

interface RouteDirectionsProps {
  totalDistance: string;
  totalDuration: string;
  directions: TurnByTurnDirection[];
  isLoading?: boolean;
  error?: string | null;
}

export const RouteDirections: React.FC<RouteDirectionsProps> = ({
  totalDistance,
  totalDuration,
  directions,
  isLoading = false,
  error = null,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAll, setShowAll] = useState(false);

  // Show first 5 steps by default
  const displayedDirections = showAll ? directions : directions.slice(0, 5);

  const getManeuverIcon = (maneuverType: string) => {
    switch (maneuverType) {
      case 'turn-left':
      case 'turn-sharp-left':
      case 'turn-slight-left':
        return <CornerDownLeft className="w-4 h-4" />;
      case 'turn-right':
      case 'turn-sharp-right':
      case 'turn-slight-right':
        return <CornerDownRight className="w-4 h-4" />;
      case 'straight':
      case 'continue':
        return <ArrowUp className="w-4 h-4" />;
      case 'arrive':
        return <MapPin className="w-4 h-4 text-green-600" />;
      case 'depart':
        return <MapPin className="w-4 h-4 text-blue-600" />;
      default:
        return <Navigation className="w-4 h-4" />;
    }
  };

  const getStepColor = (stepNumber: number, totalSteps: number): string => {
    if (stepNumber === 1) return 'text-blue-600 bg-blue-50';
    if (stepNumber === totalSteps) return 'text-green-600 bg-green-50';
    return 'text-gray-700 bg-gray-50';
  };

  if (isLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-6 animate-pulse">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gray-200 rounded-full" />
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-32 mb-2" />
            <div className="h-3 bg-gray-200 rounded w-48" />
          </div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border border-red-200 rounded-2xl p-6">
        <div className="flex items-center gap-3 text-red-600">
          <AlertCircle className="w-5 h-5" />
          <div>
            <p className="font-semibold">Unable to load directions</p>
            <p className="text-sm text-gray-600 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!directions || directions.length === 0) {
    return null;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
      {/* Header - Always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-5 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-50 rounded-xl">
            <RouteIcon className="w-6 h-6 text-blue-600" />
          </div>
          <div className="text-left">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              Turn-by-Turn Directions
            </h3>
            <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" />
                {totalDistance}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {totalDuration}
              </span>
              <span className="text-blue-600 font-medium">
                {directions.length} steps
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isExpanded && (
            <span className="text-xs text-blue-600 font-medium px-3 py-1 bg-blue-50 rounded-lg">
              View Route
            </span>
          )}
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </button>

      {/* Directions List - Collapsible */}
      {isExpanded && (
        <div className="px-6 pb-6 border-t border-gray-200">
          <div className="mt-4 space-y-3">
            {displayedDirections.map((direction, index) => (
              <div
                key={direction.stepNumber}
                className={`flex items-start gap-4 p-4 rounded-xl border-2 transition-all ${
                  direction.stepNumber === 1
                    ? 'border-blue-200 bg-blue-50/50'
                    : direction.stepNumber === directions.length
                    ? 'border-green-200 bg-green-50/50'
                    : 'border-gray-100 bg-gray-50/50 hover:border-gray-200'
                }`}
              >
                {/* Step Number & Icon */}
                <div className="flex flex-col items-center gap-2 shrink-0">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${getStepColor(
                      direction.stepNumber,
                      directions.length
                    )}`}
                  >
                    {direction.stepNumber}
                  </div>
                  {getManeuverIcon(direction.maneuverType)}
                </div>

                {/* Instruction Details */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm leading-relaxed">
                    {direction.instruction}
                  </p>
                  {direction.roadName && direction.roadName !== 'Unnamed road' && (
                    <p className="text-xs text-gray-600 mt-1">
                      on <span className="font-medium">{direction.roadName}</span>
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                    {direction.distance !== '0 m' && (
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        {direction.distance}
                      </span>
                    )}
                    {direction.duration !== '~' && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {direction.duration}
                      </span>
                    )}
                  </div>
                </div>

                {/* Visual Connector */}
                {index < displayedDirections.length - 1 && (
                  <div className="absolute left-[54px] top-full h-3 w-0.5 bg-gray-300 -translate-y-0" />
                )}
              </div>
            ))}
          </div>

          {/* Show More/Less Button */}
          {directions.length > 5 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="w-full mt-4 px-4 py-3 text-sm font-medium text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors"
            >
              {showAll ? (
                <>
                  <ChevronUp className="w-4 h-4 inline mr-2" />
                  Show Less
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 inline mr-2" />
                  Show {directions.length - 5} More Steps
                </>
              )}
            </button>
          )}

          {/* Route Summary */}
          <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-xl border border-blue-100">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-gray-900">Total Journey</span>
              </div>
              <div className="flex items-center gap-4 text-gray-700">
                <span className="font-semibold">{totalDistance}</span>
                <span>·</span>
                <span className="font-semibold">{totalDuration}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
