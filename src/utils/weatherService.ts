export interface DailyWeatherForecast {
  dayNumber: number;
  dateStr: string;
  condition: 'Sunny' | 'Partly Cloudy' | 'Misty' | 'Light Rain' | 'Clear Alpine' | 'Scattered Showers';
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

interface DestinationClimatology {
  name: string;
  baselineHigh: number;
  baselineLow: number;
  humidity: number;
  dryMonths: number[]; // 0-indexed months
  monsoonMonths: number[];
  clothing: string[];
  defaultTip: string;
}

const CLIMATOLOGY: Record<string, DestinationClimatology> = {
  goa: {
    name: 'Goa',
    baselineHigh: 31,
    baselineLow: 23,
    humidity: 68,
    dryMonths: [10, 11, 0, 1, 2], // Nov - Mar
    monsoonMonths: [5, 6, 7, 8], // Jun - Sep
    clothing: ['Linen shirts', 'Swimwear', 'Polarized sunglasses', 'Breathable sandals'],
    defaultTip: 'Comfortable coastal weather. High UV during midday; stay hydrated near beaches.',
  },
  hampi: {
    name: 'Hampi',
    baselineHigh: 30,
    baselineLow: 18,
    humidity: 45,
    dryMonths: [9, 10, 11, 0, 1], // Oct - Feb
    monsoonMonths: [6, 7, 8], // Jul - Sep
    clothing: ['Cotton trail trousers', 'Wide-brim hat', 'Sturdy walking shoes', 'Light evening scarf'],
    defaultTip: 'Dry, sunny weather among stone ruins. Early morning is ideal for temple photography.',
  },
  jaipur: {
    name: 'Jaipur',
    baselineHigh: 27,
    baselineLow: 14,
    humidity: 38,
    dryMonths: [9, 10, 11, 0, 1, 2], // Oct - Mar
    monsoonMonths: [6, 7, 8],
    clothing: ['Layered cottons', 'Evening jacket/pashmina', 'Comfortable leather slip-ons'],
    defaultTip: 'Crisp, sunny days with cool desert evenings. Carry a light jacket for hill forts at dusk.',
  },
  kerala: {
    name: 'Kerala',
    baselineHigh: 29,
    baselineLow: 22,
    humidity: 78,
    dryMonths: [10, 11, 0, 1, 2],
    monsoonMonths: [5, 6, 7, 8, 9],
    clothing: ['Loose linen clothing', 'Quick-dry shirts', 'Sunhat', 'Eco-friendly sunscreen'],
    defaultTip: 'Lush tropical warmth with gentle maritime breezes. Evenings on houseboats are balmy.',
  },
  meghalaya: {
    name: 'Meghalaya',
    baselineHigh: 21,
    baselineLow: 12,
    humidity: 82,
    dryMonths: [10, 11, 0, 1, 2],
    monsoonMonths: [4, 5, 6, 7, 8],
    clothing: ['Water-resistant windbreaker', 'Fleece layer', 'Grippy trail shoes', 'Compact umbrella'],
    defaultTip: 'Mystical valley mists and sudden light drizzles. Cloud inversions are prime at dawn.',
  },
  ladakh: {
    name: 'Ladakh',
    baselineHigh: 19,
    baselineLow: 6,
    humidity: 28,
    dryMonths: [4, 5, 6, 7, 8], // May - Sep
    monsoonMonths: [],
    clothing: ['Thermal base layers', 'Windproof down jacket', 'UV400 glacier glasses', 'Hydration pack'],
    defaultTip: 'High-altitude dry sun and chilly mountain winds. Layering is essential between day and night.',
  },
};

export function calculateMockForecast(
  destinationId: string,
  departureDateStr: string,
  numDays: number,
  customLocation?: { name: string; lat: number; country?: string }
): DestinationWeatherReport {
  const destKey = destinationId.toLowerCase();
  let climate = CLIMATOLOGY[destKey];

  if (!climate && customLocation) {
    const lat = customLocation.lat;
    const isSouthern = lat < 0;
    const absLat = Math.abs(lat);
    const baselineHigh = Math.round(Math.max(12, 33 - absLat * 0.38));
    const baselineLow = Math.round(Math.max(2, baselineHigh - (absLat > 35 ? 10 : 7)));

    climate = {
      name: customLocation.name,
      baselineHigh,
      baselineLow,
      humidity: absLat < 20 ? 72 : 55,
      dryMonths: isSouthern ? [4, 5, 6, 7, 8] : [10, 11, 0, 1, 2],
      monsoonMonths: absLat < 25 ? (isSouthern ? [11, 0, 1] : [5, 6, 7]) : [],
      clothing:
        absLat > 40
          ? ['Layered woolens & jacket', 'Comfortable walking boots', 'Windproof outer shell']
          : absLat > 25
          ? ['Smart casual layers', 'Light evening knitwear', 'Comfortable trail footwear']
          : ['Breathable linen attire', 'Sunhat & UV sunglasses', 'Comfortable walking sandals'],
      defaultTip: `Seasonal conditions for ${customLocation.name}. Check local afternoon forecasts before outdoor excursions.`,
    };
  }

  if (!climate) {
    climate = CLIMATOLOGY.goa;
  }

  const startDate = new Date(departureDateStr || new Date().toISOString());
  const month = startDate.getMonth(); // 0 to 11

  const isMonsoon = climate.monsoonMonths.includes(month);
  const isWinter = [11, 0, 1].includes(month);
  const isSummer = [3, 4, 5, 6].includes(month);

  let seasonName = 'Pleasant Travel Window';
  if (isMonsoon) seasonName = 'Monsoon Season (Seasonal Rains)';
  else if (isSummer) seasonName = 'Warm Seasonal Period';
  else if (isWinter) seasonName = 'Cool Seasonal Window';

  // Adjust baseline based on season
  let tempDelta = 0;
  if (isWinter) tempDelta = -4;
  if (isSummer) tempDelta = 4;

  const daysToForecast = Math.min(Math.max(numDays, 1), 7);
  const dailyForecasts: DailyWeatherForecast[] = [];

  for (let i = 0; i < daysToForecast; i++) {
    const dayDate = new Date(startDate);
    dayDate.setDate(startDate.getDate() + i);

    const dateStr = dayDate.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });

    // Pseudo-random deterministic variation based on day of month
    const seed = (dayDate.getDate() + i * 3) % 10;
    const high = climate.baselineHigh + tempDelta + (seed > 5 ? 1 : -1) * (seed % 3);
    const low = climate.baselineLow + tempDelta + (seed > 4 ? 1 : -1) * (seed % 2);

    let condition: DailyWeatherForecast['condition'] = 'Sunny';
    let icon: DailyWeatherForecast['conditionIcon'] = 'sun';
    let precip = 10;

    if (destKey === 'ladakh') {
      condition = seed > 7 ? 'Partly Cloudy' : 'Clear Alpine';
      icon = 'sun-snow';
      precip = 5;
    } else if (destKey === 'meghalaya') {
      condition = isMonsoon || seed > 4 ? 'Misty' : 'Partly Cloudy';
      icon = condition === 'Misty' ? 'cloud-fog' : 'cloud-sun';
      precip = isMonsoon ? 75 : 25;
    } else if (isMonsoon) {
      condition = seed > 5 ? 'Light Rain' : 'Scattered Showers';
      icon = 'cloud-rain';
      precip = 65 + (seed % 25);
    } else if (seed > 6) {
      condition = 'Partly Cloudy';
      icon = 'cloud-sun';
      precip = 15;
    }

    dailyForecasts.push({
      dayNumber: i + 1,
      dateStr,
      condition,
      conditionIcon: icon,
      tempHighC: high,
      tempLowC: low,
      humidityPercent: Math.min(
        95,
        Math.max(20, climate.humidity + (isMonsoon ? 15 : -5) + (seed % 6))
      ),
      precipitationChance: precip,
      windSpeedKmh: 12 + (seed % 10),
      uvIndex: destKey === 'ladakh' ? 9 : isMonsoon ? 4 : 7,
      summary: `${condition} with comfortable breezes. Daytime highs around ${high}°C.`,
      advisoryTip: climate.defaultTip,
    });
  }

  return {
    destinationId,
    destinationName: climate.name,
    seasonName,
    averageClimateSummary: `Expected seasonal temperatures range from ${climate.baselineLow + tempDelta}°C overnight to ${climate.baselineHigh + tempDelta}°C during midday sun.`,
    recommendedClothing: climate.clothing,
    days: dailyForecasts,
    isDemoSimulation: true,
  };
}

/**
 * Async mock API simulating external meteorological service fetch
 */
export async function fetchWeatherForecast(
  destinationId: string,
  departureDateStr: string,
  numDays: number,
  customLocation?: { name: string; lat: number; country?: string }
): Promise<DestinationWeatherReport> {
  // Simulate network latency (250ms)
  await new Promise((resolve) => setTimeout(resolve, 250));
  return calculateMockForecast(destinationId, departureDateStr, numDays, customLocation);
}
