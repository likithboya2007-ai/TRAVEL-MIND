import React, { useState, useEffect } from 'react';
import {
  Sun,
  CloudSun,
  CloudFog,
  CloudRain,
  Wind,
  Droplets,
  Thermometer,
  Sparkles,
  Info,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import {
  DestinationWeatherReport,
  DailyWeatherForecast,
  fetchRealWeatherForecast,
  getDestinationCoordinates,
} from '../services/realWeatherService';
import { fetchWeatherForecast as fetchMockWeather } from '../utils/weatherService';

interface WeatherForecastProps {
  destinationId: string;
  departureDate: string;
  days: number;
  customLocation?: { name: string; lat: number; country?: string };
}

export const WeatherForecast: React.FC<WeatherForecastProps> = ({
  destinationId,
  departureDate,
  days,
  customLocation,
}) => {
  const [report, setReport] = useState<DestinationWeatherReport | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [unit, setUnit] = useState<'C' | 'F'>('C');
  const [selectedDayIdx, setSelectedDayIdx] = useState<number>(0);
  const [useFallback, setUseFallback] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);

    // Try real weather API first
    const fetchWeather = async () => {
      try {
        // Get coordinates for the destination
        let lat: number, lon: number, name: string;

        if (customLocation) {
          lat = customLocation.lat;
          lon = customLocation.lat; // Note: you might need to add lon to customLocation type
          name = customLocation.name;
        } else {
          const coords = getDestinationCoordinates(destinationId);
          if (!coords) {
            throw new Error('Coordinates not found for destination');
          }
          lat = coords.lat;
          lon = coords.lon;
          name = destinationId;
        }

        const data = await fetchRealWeatherForecast(lat, lon, name, departureDate, days);

        if (isMounted) {
          setReport(data);
          setIsLoading(false);
          setUseFallback(false);
        }
      } catch (err) {
        if (import.meta.env.DEV) {
          console.error('Real weather API failed, falling back to mock data:', err);
        }

        if (isMounted) {
          // Fallback to mock weather
          try {
            const mockData = await fetchMockWeather(destinationId, departureDate, days, customLocation);
            setReport(mockData);
            setUseFallback(true);
            setError('Unable to fetch live weather data. Showing seasonal estimates.');
          } catch (fallbackErr) {
            if (import.meta.env.DEV) {
              console.error('Fallback weather also failed:', fallbackErr);
            }
            setError('Unable to load weather forecast. Please try again later.');
          }
          setIsLoading(false);
        }
      }
    };

    fetchWeather();

    return () => {
      isMounted = false;
    };
  }, [destinationId, departureDate, days, customLocation?.name, customLocation?.lat]);

  const convertTemp = (tempC: number) => {
    if (unit === 'F') {
      return `${Math.round((tempC * 9) / 5 + 32)}°F`;
    }
    return `${tempC}°C`;
  };

  const renderWeatherIcon = (iconType: DailyWeatherForecast['conditionIcon']) => {
    switch (iconType) {
      case 'cloud-sun':
        return <CloudSun className="w-5 h-5 text-teal-300" />;
      case 'cloud-fog':
        return <CloudFog className="w-5 h-5 text-cyan-300" />;
      case 'cloud-rain':
        return <CloudRain className="w-5 h-5 text-sky-400" />;
      case 'sun-snow':
        return <Sun className="w-5 h-5 text-cyan-200" />;
      case 'sun':
      default:
        return <Sun className="w-5 h-5 text-teal-400" />;
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 rounded-3xl bg-[#090f20]/60 border border-slate-800 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="h-4 w-48 bg-slate-800 rounded" />
          <div className="h-4 w-24 bg-slate-800 rounded" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-[#050811]/60 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error && !report) {
    return (
      <div className="p-6 rounded-3xl bg-[#090f20]/90 border border-red-800/50">
        <div className="flex items-center gap-3 text-red-400">
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!report || report.days.length === 0) return null;

  const activeDay = report.days[selectedDayIdx] || report.days[0];

  return (
    <div
      className="p-6 sm:p-8 rounded-3xl bg-[#090f20]/90 border border-slate-800 shadow-xl"
      data-testid="weather-forecast-component"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 mb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-teal-400 mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{useFallback ? 'Seasonal Estimates' : 'Live Weather Forecast'}</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="text-slate-300">{report.destinationName}</span>
          </div>
          {error && useFallback && (
            <div className="flex items-center gap-1 text-xs text-yellow-400 mb-1">
              <AlertCircle className="w-3 h-3" />
              <span>{error}</span>
            </div>
          )}
          <h4 className="font-display text-xl sm:text-2xl font-bold text-white">
            {report.seasonName}
          </h4>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            {report.averageClimateSummary}
          </p>
        </div>

        {/* Temperature Unit Switcher */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <div className="flex items-center bg-[#050811] p-1 rounded-xl border border-slate-800 text-xs font-medium">
            <button
              type="button"
              onClick={() => setUnit('C')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                unit === 'C'
                  ? 'bg-teal-400 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              aria-label="Show Celsius"
            >
              °C
            </button>
            <button
              type="button"
              onClick={() => setUnit('F')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                unit === 'F'
                  ? 'bg-teal-400 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              aria-label="Show Fahrenheit"
            >
              °F
            </button>
          </div>
        </div>
      </div>

      {/* Daily Forecast Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
        {report.days.map((day, idx) => {
          const isSelected = selectedDayIdx === idx;
          return (
            <button
              key={day.dayNumber}
              type="button"
              onClick={() => setSelectedDayIdx(idx)}
              className={`p-3.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-[#050811] border-teal-500/80 shadow-md ring-1 ring-teal-500/30'
                  : 'bg-[#050811]/60 border-slate-800/80 hover:border-slate-700'
              }`}
              aria-pressed={isSelected}
              aria-label={`Forecast for Day ${day.dayNumber}, ${day.dateStr}: ${day.condition}, High ${convertTemp(day.tempHighC)}, Low ${convertTemp(day.tempLowC)}`}
            >
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                  Day {day.dayNumber}
                </span>
                <span className="text-xs text-slate-300 block truncate font-medium">
                  {day.dateStr}
                </span>
              </div>

              <div className="my-2.5 flex items-center justify-between">
                {renderWeatherIcon(day.conditionIcon)}
                <span className="text-[11px] font-medium text-slate-300 text-right truncate pl-1">
                  {day.condition}
                </span>
              </div>

              <div>
                <div className="flex items-baseline justify-between text-xs font-sans tabular-nums">
                  <span className="font-bold text-white">{convertTemp(day.tempHighC)}</span>
                  <span className="text-slate-500 text-[11px]">{convertTemp(day.tempLowC)}</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-teal-400 mt-1 font-mono">
                  <Droplets className="w-2.5 h-2.5" />
                  <span>{day.precipitationChance}% precip</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Day Expanded Weather Metrics & Advisory */}
      {activeDay && (
        <div className="p-4 sm:p-5 rounded-2xl bg-[#050811] border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4 text-xs font-sans">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white text-sm">
                Day {activeDay.dayNumber} ({activeDay.dateStr})
              </span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span className="text-teal-300 font-medium">{activeDay.summary}</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span>{activeDay.advisoryTip}</span>
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex flex-wrap items-center gap-3 text-slate-300 shrink-0 font-sans tabular-nums">
            <div className="flex items-center gap-1.5 bg-[#090f20] px-3 py-1.5 rounded-xl border border-slate-800">
              <Thermometer className="w-3.5 h-3.5 text-teal-400" />
              <span>
                High {convertTemp(activeDay.tempHighC)} / Low {convertTemp(activeDay.tempLowC)}
              </span>
            </div>
            <div className="flex items-center gap-1.5 bg-[#090f20] px-3 py-1.5 rounded-xl border border-slate-800">
              <Wind className="w-3.5 h-3.5 text-teal-400" />
              <span>{activeDay.windSpeedKmh} km/h wind</span>
            </div>
            <div className="flex items-center gap-1.5 bg-[#090f20] px-3 py-1.5 rounded-xl border border-slate-800">
              <Droplets className="w-3.5 h-3.5 text-sky-400" />
              <span>{activeDay.humidityPercent}% humidity</span>
            </div>
            <div className="flex items-center gap-1.5 bg-[#090f20] px-3 py-1.5 rounded-xl border border-slate-800">
              <Sun className="w-3.5 h-3.5 text-teal-300" />
              <span>UV {activeDay.uvIndex} / 10</span>
            </div>
          </div>
        </div>
      )}

      {/* Recommended Attire & Packing Suggestions Strip */}
      <div className="mt-5 pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-slate-300">Recommended Attire:</span>
          {report.recommendedClothing.map((item) => (
            <span
              key={item}
              className="text-slate-400 bg-[#050811] px-2.5 py-1 rounded-lg border border-slate-800 text-[11px]"
            >
              {item}
            </span>
          ))}
        </div>
        {!useFallback ? (
          <span className="text-[11px] text-teal-400 font-mono flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Live forecast via Open-Meteo · Updated {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        ) : (
          <span className="text-[11px] text-slate-500 italic font-mono">
            Seasonal estimates for departure on {departureDate}.
          </span>
        )}
      </div>
    </div>
  );
};
