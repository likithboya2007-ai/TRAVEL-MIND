import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { ItineraryStop } from '../utils/plannerLogic';
import { Destination } from '../data/destinations';
import { 
  fetchRoute, 
  getStraightLineRoute, 
  isRoutingConfigured,
  RouteCoordinate,
  ProcessedRoute 
} from '../services/routingService';
import { RouteDirections } from './RouteDirections';
import { useAuth } from '../contexts/AuthContext';

interface TravelMapProps {
  destination: Destination;
  stops: ItineraryStop[];
  selectedStopId: string | null;
  onSelectStop: (stopId: string) => void;
}

export const TravelMap: React.FC<TravelMapProps> = ({
  destination,
  stops,
  selectedStopId,
  onSelectStop,
}) => {
  const { session } = useAuth();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});
  const polylineRef = useRef<L.Polyline | null>(null);
  
  const [route, setRoute] = useState<ProcessedRoute | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [useAdvancedRouting, setUseAdvancedRouting] = useState(isRoutingConfigured());

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [destination.lat, destination.lng],
        zoom: 11,
        zoomControl: false,
        scrollWheelZoom: false,
      });

      // Add zoom control in bottom-right to prevent collision with top-left route badge
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Standard OpenStreetMap tiles with sleek dark styling
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
        maxZoom: 19,
        className: 'map-tiles-dark',
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update center when destination changes
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([destination.lat, destination.lng], 11);
    }
  }, [destination]);

  // Fetch route when stops change
  useEffect(() => {
    if (stops.length < 2) {
      setRoute(null);
      return;
    }

    const fetchRouteData = async () => {
      setRouteLoading(true);
      setRouteError(null);

      try {
        const coordinates: RouteCoordinate[] = stops.map(stop => ({
          lat: stop.lat,
          lng: stop.lng,
        }));

        let routeData: ProcessedRoute;

        if (useAdvancedRouting) {
          // Try OpenRouteService API
          try {
            routeData = await fetchRoute(coordinates, 'driving-car', {
              token: session?.access_token,
            });
          } catch (error) {
            console.warn('OpenRouteService failed, using fallback:', error);
            routeData = getStraightLineRoute(coordinates);
            setRouteError('Unable to load directions - Using direct route.');
          }
        } else {
          routeData = getStraightLineRoute(coordinates);
        }

        setRoute(routeData);
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('Failed to fetch route:', error);
        }
        setRouteError(error instanceof Error ? error.message : 'Failed to load route');
      } finally {
        setRouteLoading(false);
      }
    };

    fetchRouteData();
  }, [stops, useAdvancedRouting]);

  // Update markers and polyline when stops or route changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear old markers
    Object.values(markersRef.current).forEach((marker) => marker.remove());
    markersRef.current = {};

    if (polylineRef.current) {
      polylineRef.current.remove();
      polylineRef.current = null;
    }

    if (stops.length === 0) {
      const destIcon = L.divIcon({
        html: `
          <div style="
            width: 38px;
            height: 38px;
            border-radius: 50%;
            background: #0EA5E9;
            color: #ffffff;
            border: 2px solid #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
            cursor: pointer;
          ">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
        `,
        className: 'custom-destination-marker',
        iconSize: [38, 38],
        iconAnchor: [19, 19],
      });
      const destMarker = L.marker([destination.lat, destination.lng], { icon: destIcon }).addTo(map);
      destMarker.bindPopup(`
        <div style="font-family: inherit; padding: 4px;">
          <div style="font-size: 11px; text-transform: uppercase; color: #0EA5E9; font-weight: 600; margin-bottom: 2px;">
            Target Destination
          </div>
          <div style="font-weight: 700; font-size: 15px; color: #1A1A1A; margin-bottom: 3px;">
            ${destination.name}
          </div>
          <div style="font-size: 12px; color: #6B7280;">
            ${destination.state ? `${destination.state} · ` : ''}${destination.lat.toFixed(4)}°, ${destination.lng.toFixed(4)}°
          </div>
        </div>
      `, {
        autoPan: true,
        autoPanPadding: [80, 80],
      });
      markersRef.current['destination-center'] = destMarker;
      map.setView([destination.lat, destination.lng], 12);
      return;
    }

    const latLngs: L.LatLngExpression[] = [];

    stops.forEach((stop, index) => {
      const isSelected = selectedStopId === stop.id;
      latLngs.push([stop.lat, stop.lng]);

      // Custom HTML Numbered Pin in Blue / White
      const iconHtml = `
        <div style="
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: ${isSelected ? '#0EA5E9' : '#ffffff'};
          color: ${isSelected ? '#ffffff' : '#0EA5E9'};
          border: 2px solid ${isSelected ? '#ffffff' : '#0EA5E9'};
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 13px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
          cursor: pointer;
          transition: transform 0.2s ease;
        ">
          ${index + 1}
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-stop-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([stop.lat, stop.lng], { icon: customIcon }).addTo(map);

      marker.bindPopup(`
        <div style="font-family: inherit; padding: 4px;">
          <div style="font-size: 11px; text-transform: uppercase; color: #0EA5E9; font-weight: 600; margin-bottom: 2px;">
            Stop ${index + 1} · Day ${stop.dayNumber}
          </div>
          <div style="font-weight: 700; font-size: 14px; color: #1A1A1A; margin-bottom: 4px;">
            ${stop.name}
          </div>
          <div style="font-size: 12px; color: #4B5563; line-height: 1.4; margin-bottom: 6px;">
            ${stop.highlight || stop.description}
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 11px; color: #6B7280; border-top: 1px solid #E5E7EB; padding-top: 4px;">
            <span>⏱ ~${stop.durationHours} hrs</span>
            <span>Est. ~₹${stop.estimatedCostInr}</span>
          </div>
        </div>
      `, {
        autoPan: true,
        autoPanPadding: [80, 80],
        offset: [0, -10],
      });

      marker.on('click', () => {
        onSelectStop(stop.id);
      });

      markersRef.current[stop.id] = marker;
    });

    // Draw connecting route - use API route if available, otherwise straight line
    if (latLngs.length > 1) {
      let routeCoordinates: L.LatLngExpression[];

      if (route && route.polyline.length > 0) {
        // Use detailed route from API
        routeCoordinates = route.polyline.map(coord => [coord.lat, coord.lng]);
      } else {
        // Fallback to straight line
        routeCoordinates = latLngs;
      }

      polylineRef.current = L.polyline(routeCoordinates, {
        color: route && route.polyline.length > 0 ? '#0EA5E9' : '#0EA5E9',
        weight: route && route.polyline.length > 0 ? 4 : 3,
        opacity: route && route.polyline.length > 0 ? 0.8 : 0.7,
        dashArray: route && route.polyline.length > 0 ? undefined : '6, 8',
      }).addTo(map);

      // Fit bounds comfortably with ample padding
      const bounds = route && route.polyline.length > 0
        ? L.latLngBounds(route.polyline.map(coord => [coord.lat, coord.lng]))
        : L.latLngBounds(latLngs);
      
      map.fitBounds(bounds, {
        paddingTopLeft: [60, 80],
        paddingBottomRight: [60, 60],
        maxZoom: 14,
      });
    } else if (latLngs.length === 1) {
      map.setView(latLngs[0], 12);
    }
  }, [stops, selectedStopId, route]);

  // Center on selected stop when selected externally
  useEffect(() => {
    if (selectedStopId && markersRef.current[selectedStopId] && mapInstanceRef.current) {
      const marker = markersRef.current[selectedStopId];
      mapInstanceRef.current.panTo(marker.getLatLng(), { animate: true, duration: 0.5 });
      marker.openPopup();
    }
  }, [selectedStopId]);

  return (
    <>
      <div className="relative w-full rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-sm">
        {/* Map Header Overlay */}
        <div className="absolute top-4 left-4 z-20 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl px-4 py-2.5 shadow-md text-xs pointer-events-auto">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            <span className="font-semibold text-gray-900">{destination.name} Journey Route</span>
            <span aria-hidden="true" className="text-gray-400">·</span>
            <span className="text-blue-600 font-mono">{stops.length} Stops</span>
          </div>
          <p className="text-[11px] text-gray-600 mt-0.5">
            {useAdvancedRouting && route?.polyline.length
              ? 'Turn-by-turn routing via OpenRouteService'
              : 'Direct route visualization (OpenStreetMap data)'}
          </p>
        </div>

        {/* Map DOM Element */}
        <div
          ref={mapContainerRef}
          className="w-full h-[400px] sm:h-[480px] z-10"
          data-testid="interactive-travel-map"
        />
      </div>

      {/* Route Directions Component */}
      {route && stops.length > 1 && (
        <div className="mt-6">
          <RouteDirections
            totalDistance={route.totalDistance}
            totalDuration={route.totalDuration}
            directions={route.directions}
            isLoading={routeLoading}
            error={routeError}
          />
        </div>
      )}
    </>
  );
};
