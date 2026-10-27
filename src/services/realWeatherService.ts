/**
 * Real Weather Service using Open-Meteo API
 * Free, no API key required, high-resolution forecasts
 * https://open-meteo.com/
 */

export interface RealWeatherData {
  latitude: number;
  longitude: number;
  timezone: string;
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max: number[];
    precipitation_sum: number[];
    wind_speed_10m_max: number[];
    uv_index_max: number[];
  };
}

export interface DailyWeatherForecast {
  dayNumber: number;
  dateStr: string;
  condition: string;
  conditionIcon: 'sun' | 'cloud-sun' | 'cloud-fog' | 'cloud-rain' | 'sun-snow' | 'cloud-lightning';
  tempHighC: number;
  tempLowC: number;
  humidityPercent: number;
  precipitationChance: number;
  windSpeedKmh: number;
  uvIndex: number;
  summary: string;
  advisoryTip: string;
}

export interface DestinationWeatherReport {
  destinationId: string;
  destinationName: string;
  seasonName: string;
  averageClimateSummary: string;
  recommendedClothing: string[];
  days: DailyWeatherForecast[];
  isDemoSimulation: boolean;
}

/**
 * WMO Weather Code to readable condition and icon mapping
 * Reference: https://open-meteo.com/en/docs
 */
function getWeatherCondition(code: number): {
  condition: string;
  icon: DailyWeatherForecast['conditionIcon'];
} {
  if (code === 0) return { condition: 'Sunny', icon: 'sun' };
  if (code <= 3) return { condition: 'Partly Cloudy', icon: 'cloud-sun' };
  if (code <= 48) return { condition: 'Misty', icon: 'cloud-fog' };
  if (code <= 67) return { condition: 'Light Rain', icon: 'cloud-rain' };
  if (code <= 77) return { condition: 'Scattered Showers', icon: 'cloud-rain' };
  if (code <= 86) return { condition: 'Light Rain', icon: 'cloud-rain' };
  return { condition: 'Scattered Showers', icon: 'cloud-lightning' };
}

/**
 * Generate clothing recommendations based on temperature range
 */
function getClothingRecommendations(avgHigh: number, avgLow: number, avgPrecip: number): string[] {
  const avgTemp = (avgHigh + avgLow) / 2;
  const isWet = avgPrecip > 5;

  const recommendations: string[] = [];

  // Temperature-based clothing
  if (avgTemp > 28) {
    recommendations.push('Light cotton clothing', 'Breathable footwear', 'Sunhat & sunglasses');
  } else if (avgTemp > 22) {
    recommendations.push('Comfortable casual wear', 'Light layers', 'Walking shoes');
  } else if (avgTemp > 15) {
    recommendations.push('Light jacket', 'Layered clothing', 'Comfortable walking shoes');
  } else if (avgTemp > 8) {
    recommendations.push('Warm jacket', 'Sweaters & layers', 'Closed-toe shoes');
  } else {
    recommendations.push('Winter coat', 'Thermal layers', 'Warm boots', 'Gloves & scarf');
  }

  // Weather-based additions
  if (isWet) {
    recommendations.push('Waterproof jacket', 'Umbrella');
  }

  if (avgHigh > 25) {
    recommendations.push('Sunscreen SPF 30+');
  }

  return recommendations.slice(0, 6); // Limit to 6 items
}

/**
 * Get season name based on month and temperature
 */
function getSeasonName(month: number, avgTemp: number): string {
  // Northern hemisphere seasons
  if (month >= 2 && month <= 4) {
    return avgTemp > 20 ? 'Warm Spring Period' : 'Pleasant Spring Window';
  } else if (month >= 5 && month <= 8) {
    return avgTemp > 28 ? 'Hot Summer Season' : 'Warm Summer Period';
  } else if (month >= 9 && month <= 10) {
    return avgTemp > 20 ? 'Pleasant Autumn Window' : 'Cool Autumn Period';
  } else {
    return avgTemp < 10 ? 'Cool Winter Season' : 'Mild Winter Period';
  }
}

/**
 * Generate advisory tip based on weather conditions
 */
function getAdvisoryTip(
  condition: string,
  tempHigh: number,
  uvIndex: number,
  precipChance: number
): string {
  const tips: string[] = [];

  if (uvIndex >= 8) {
    tips.push('High UV levels - apply sunscreen regularly');
  } else if (uvIndex >= 6) {
    tips.push('Moderate UV - sun protection recommended');
  }

  if (tempHigh > 32) {
    tips.push('Stay hydrated in hot conditions');
  } else if (tempHigh < 5) {
    tips.push('Bundle up for cold weather');
  }

  if (precipChance > 60) {
    tips.push('High chance of rain - carry waterproof gear');
  } else if (precipChance > 30) {
    tips.push('Possible showers - bring an umbrella');
  }

  if (condition.includes('Sunny') || condition.includes('Clear')) {
    tips.push('Perfect weather for outdoor activities');
  }

  return tips.length > 0
    ? tips.join('. ') + '.'
    : 'Comfortable conditions for travel. Enjoy your day!';
}

/**
 * Fetch real weather forecast from Open-Meteo API
 */
export async function fetchRealWeatherForecast(
  latitude: number,
  longitude: number,
  destinationName: string,
  departureDateStr: string,
  numDays: number
): Promise<DestinationWeatherReport> {
  const days = Math.min(Math.max(numDays, 1), 16); // Open-Meteo supports up to 16 days

  // Build API URL
  const params = new URLSearchParams({
    latitude: latitude.toString(),
    longitude: longitude.toString(),
    daily: [
      'weather_code',
      'temperature_2m_max',
      'temperature_2m_min',
      'precipitation_probability_max',
      'precipitation_sum',
      'wind_speed_10m_max',
      'uv_index_max',
    ].join(','),
    timezone: 'auto',
    forecast_days: days.toString(),
  });

  const url = `https://api.open-meteo.com/v1/forecast?${params}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Weather API returned ${response.status}: ${response.statusText}`);
    }

    const data: RealWeatherData = await response.json();

    // Process daily forecasts
    const dailyForecasts: DailyWeatherForecast[] = [];
    const startDate = new Date(departureDateStr || new Date().toISOString());

    // Calculate averages for clothing recommendations
    const avgHigh =
      data.daily.temperature_2m_max.reduce((a, b) => a + b, 0) /
      data.daily.temperature_2m_max.length;
    const avgLow =
      data.daily.temperature_2m_min.reduce((a, b) => a + b, 0) /
      data.daily.temperature_2m_min.length;
    const avgPrecip =
      data.daily.precipitation_sum.reduce((a, b) => a + b, 0) / data.daily.precipitation_sum.length;

    for (let i = 0; i < data.daily.time.length; i++) {
      const dayDate = new Date(data.daily.time[i]);
      const dateStr = dayDate.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });

      const weatherCode = data.daily.weather_code[i];
      const { condition, icon } = getWeatherCondition(weatherCode);
      const tempHigh = Math.round(data.daily.temperature_2m_max[i]);
      const tempLow = Math.round(data.daily.temperature_2m_min[i]);
      const precipChance = data.daily.precipitation_probability_max[i] || 0;
      const windSpeed = Math.round(data.daily.wind_speed_10m_max[i]);
      const uvIndex = Math.round(data.daily.uv_index_max[i] || 0);

      dailyForecasts.push({
        dayNumber: i + 1,
        dateStr,
        condition,
        conditionIcon: icon,
        tempHighC: tempHigh,
        tempLowC: tempLow,
        humidityPercent: 65, // Open-Meteo doesn't provide daily humidity max, using reasonable default
        precipitationChance: precipChance,
        windSpeedKmh: windSpeed,
        uvIndex,
        summary: `${condition} with ${windSpeed} km/h winds. Daytime highs around ${tempHigh}°C.`,
        advisoryTip: getAdvisoryTip(condition, tempHigh, uvIndex, precipChance),
      });
    }

    // Get season name
    const month = startDate.getMonth();
    const avgTemp = (avgHigh + avgLow) / 2;
    const seasonName = getSeasonName(month, avgTemp);

    // Get clothing recommendations
    const recommendedClothing = getClothingRecommendations(avgHigh, avgLow, avgPrecip);

    return {
      destinationId: destinationName.toLowerCase().replace(/\s+/g, '-'),
      destinationName,
      seasonName,
      averageClimateSummary: `Expected temperatures range from ${Math.round(avgLow)}°C overnight to ${Math.round(avgHigh)}°C during the day.`,
      recommendedClothing,
      days: dailyForecasts,
      isDemoSimulation: false,
    };
  } catch (error) {
    if (import.meta.env.DEV) {
      if (import.meta.env.DEV) {
        console.error('Failed to fetch weather forecast:', error);
      }
      if (import.meta.env.DEV) {
        console.error('Failed to fetch weather forecast:', error);
      }}

    // Fallback to a simple error state
    throw new Error(
      `Unable to fetch weather data. Please check your connection and try again. Details: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Get coordinates for a destination
 * This can be enhanced later with a geocoding service
 */
export function getDestinationCoordinates(destinationId: string): {
  lat: number;
  lon: number;
} | null {
  const coordinates: Record<string, { lat: number; lon: number }> = {
    goa: { lat: 15.2993, lon: 74.124 },
    hampi: { lat: 15.335, lon: 76.46 },
    jaipur: { lat: 26.9124, lon: 75.7873 },
    kerala: { lat: 10.8505, lon: 76.2711 }, // Munnar
    meghalaya: { lat: 25.2677, lon: 91.7337 }, // Shillong
    ladakh: { lat: 34.1526, lon: 77.577 }, // Leh
  };

  return coordinates[destinationId.toLowerCase()] || null;
}

