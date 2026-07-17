import type { Location } from '../types';

export interface NwsPeriod {
  number: number;
  name: string;
  isDaytime: boolean;
  temperature: number;
  temperatureUnit: string;
  windSpeed: string;
  windDirection: string;
  shortForecast: string;
  detailedForecast: string;
  probabilityOfPrecipitation: number | null;
  icon: string;
}

export interface NwsForecastData {
  officeId: string;
  officeName: string;
  periods: NwsPeriod[];
}

const HEADERS = { Accept: 'application/geo+json' };

export async function fetchNwsForecast(location: Location): Promise<NwsForecastData> {
  const pointRes = await fetch(
    `https://api.weather.gov/points/${location.latitude},${location.longitude}`,
    { headers: HEADERS },
  );
  if (!pointRes.ok) throw new Error(`NWS point lookup failed (${pointRes.status})`);
  const pointData = await pointRes.json();
  const forecastUrl: string | undefined = pointData.properties?.forecast;
  const gridId: string | undefined = pointData.properties?.gridId;
  if (!forecastUrl) throw new Error('No NWS forecast available for this location');

  const [forecastRes, officeRes] = await Promise.all([
    fetch(forecastUrl, { headers: HEADERS }),
    gridId
      ? fetch(`https://api.weather.gov/offices/${gridId}`, { headers: HEADERS }).catch(() => null)
      : Promise.resolve(null),
  ]);
  if (!forecastRes.ok) throw new Error(`NWS forecast fetch failed (${forecastRes.status})`);
  const forecastData = await forecastRes.json();
  const officeData = officeRes && officeRes.ok ? await officeRes.json() : null;

  const rawPeriods: unknown[] = forecastData.properties?.periods ?? [];
  const periods: NwsPeriod[] = rawPeriods.map((raw) => {
    const p = raw as Record<string, unknown>;
    const pop = p.probabilityOfPrecipitation as { value?: number } | undefined;
    return {
      number: Number(p.number ?? 0),
      name: String(p.name ?? ''),
      isDaytime: Boolean(p.isDaytime),
      temperature: Number(p.temperature ?? 0),
      temperatureUnit: String(p.temperatureUnit ?? 'F'),
      windSpeed: String(p.windSpeed ?? ''),
      windDirection: String(p.windDirection ?? ''),
      shortForecast: String(p.shortForecast ?? ''),
      detailedForecast: String(p.detailedForecast ?? ''),
      probabilityOfPrecipitation: pop?.value ?? null,
      icon: String(p.icon ?? ''),
    };
  });

  const officeName = officeData?.name ?? officeData?.properties?.name ?? gridId ?? 'National Weather Service';

  return {
    officeId: gridId ?? '',
    officeName: String(officeName),
    periods,
  };
}
