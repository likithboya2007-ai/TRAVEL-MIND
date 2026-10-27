import { describe, it, expect } from 'vitest';
import { calculateMockForecast, fetchWeatherForecast } from './weatherService';

describe('calculateMockForecast', () => {
  it('returns correct day count and climate profile for destination', () => {
    const forecast = calculateMockForecast('goa', '2026-11-15', 4);

    expect(forecast.destinationName).toBe('Goa');
    expect(forecast.days.length).toBe(4);
    expect(forecast.days[0].tempHighC).toBeGreaterThan(20);
    expect(forecast.recommendedClothing.length).toBeGreaterThan(0);
    expect(forecast.isDemoSimulation).toBe(true);
  });

  it('handles Ladakh cold alpine conditions and winter adjustments', () => {
    const ladakhForecast = calculateMockForecast('ladakh', '2026-06-10', 3);
    expect(ladakhForecast.destinationName).toBe('Ladakh');
    expect(ladakhForecast.days[0].uvIndex).toBeGreaterThanOrEqual(8);

    const meghalayaForecast = calculateMockForecast('meghalaya', '2026-07-15', 5);
    expect(meghalayaForecast.destinationName).toBe('Meghalaya');
    expect(meghalayaForecast.days[0].precipitationChance).toBeGreaterThan(40);
  });
});

describe('fetchWeatherForecast', () => {
  it('async mock API resolves with report', async () => {
    const report = await fetchWeatherForecast('jaipur', '2026-12-01', 3);
    expect(report.destinationName).toBe('Jaipur');
    expect(report.days.length).toBe(3);
    expect(report.averageClimateSummary).toContain('°C');
  });
});

