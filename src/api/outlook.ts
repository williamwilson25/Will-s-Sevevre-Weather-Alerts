import type { CityPoint } from '../data/cities';

export type OutlookTier = 'slight' | 'moderate' | 'likely';

export interface OutlookPoint extends CityPoint {
  probability: number;
  weatherCode: number;
  tier: OutlookTier;
}

const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const STORM_CODES = new Set([95, 96, 99]);

function tierFor(probability: number, weatherCode: number): OutlookTier {
  if (STORM_CODES.has(weatherCode) || probability >= 50) return 'likely';
  if (probability >= 30) return 'moderate';
  return 'slight';
}

export async function fetchStormOutlook(cities: CityPoint[], dayIndex: number): Promise<OutlookPoint[]> {
  if (cities.length === 0) return [];

  const url = new URL(FORECAST_URL);
  url.searchParams.set('latitude', cities.map((c) => c.lat).join(','));
  url.searchParams.set('longitude', cities.map((c) => c.lon).join(','));
  url.searchParams.set('daily', 'precipitation_probability_max,weather_code');
  url.searchParams.set('forecast_days', '7');
  url.searchParams.set('timezone', 'auto');

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Outlook fetch failed (${res.status})`);
  const data = await res.json();
  const results: unknown[] = Array.isArray(data) ? data : [data];

  return results.map((entry, i) => {
    const r = entry as {
      daily: { precipitation_probability_max: number[]; weather_code: number[] };
    };
    const probability = r.daily.precipitation_probability_max[dayIndex] ?? 0;
    const weatherCode = r.daily.weather_code[dayIndex] ?? 0;
    return {
      ...cities[i],
      probability,
      weatherCode,
      tier: tierFor(probability, weatherCode),
    };
  });
}

export const TIER_LABEL: Record<OutlookTier, string> = {
  slight: 'Slight',
  moderate: 'Moderate',
  likely: 'Likely',
};

export const TIER_COLOR: Record<OutlookTier, string> = {
  slight: '#86efac',
  moderate: '#22c55e',
  likely: '#166534',
};
