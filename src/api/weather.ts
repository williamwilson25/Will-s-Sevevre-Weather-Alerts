import type {
  CurrentConditions,
  DailyForecast,
  HourlyPoint,
  Location,
  WeatherSnapshot,
} from '../types';
import { assessDailyRisk } from '../utils/severity';
import { mapNwsTextToWeatherCode } from '../utils/nwsWeatherCode';
import { computeSunTimes } from '../utils/sunTimes';

const GEOCODE_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const NWS_HEADERS = { Accept: 'application/geo+json' };

interface GeocodeResult {
  id: number;
  name: string;
  admin1?: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

// Location search has no NWS equivalent (they don't do geocoding) — this stays
// on Open-Meteo's free keyless geocoding API purely to turn a typed city name
// into coordinates; no weather data comes from this call.
export async function searchLocations(query: string): Promise<Location[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const url = new URL(GEOCODE_URL);
  url.searchParams.set('name', trimmed);
  url.searchParams.set('count', '6');
  url.searchParams.set('language', 'en');
  url.searchParams.set('format', 'json');

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Location search failed (${res.status})`);
  const data = await res.json();
  const results: GeocodeResult[] = data.results ?? [];

  return results.map((r) => ({
    id: String(r.id),
    name: r.name,
    admin1: r.admin1,
    country: r.country,
    latitude: r.latitude,
    longitude: r.longitude,
    timezone: r.timezone,
  }));
}

function celsiusToFahrenheit(c: number): number {
  return (c * 9) / 5 + 32;
}

function kmhToMph(kmh: number): number {
  return kmh / 1.60934;
}

function paToHpa(pa: number): number {
  return pa / 100;
}

function parseWindMph(text: string | undefined): number {
  if (!text) return 0;
  const matches = text.match(/\d+/g);
  if (!matches) return 0;
  return Math.max(...matches.map(Number));
}

function parseGustMph(detailedForecast: string | undefined): number | null {
  if (!detailedForecast) return null;
  const match = detailedForecast.match(/gusts?\s*(?:as high as|up to|to)?\s*(\d+)\s*mph/i);
  return match ? Number(match[1]) : null;
}

interface NwsPointMeta {
  gridId: string;
  forecast: string;
  forecastHourly: string;
  observationStations: string;
  timezone: string;
}

async function fetchPointMeta(location: Location): Promise<NwsPointMeta> {
  const res = await fetch(
    `https://api.weather.gov/points/${location.latitude},${location.longitude}`,
    { headers: NWS_HEADERS },
  );
  if (!res.ok) throw new Error(`NWS point lookup failed (${res.status})`);
  const data = await res.json();
  const p = data.properties ?? {};
  if (!p.forecast || !p.forecastHourly || !p.observationStations) {
    throw new Error('NWS has no forecast coverage for this location');
  }
  return {
    gridId: p.gridId ?? '',
    forecast: p.forecast,
    forecastHourly: p.forecastHourly,
    observationStations: p.observationStations,
    timezone: p.timeZone ?? location.timezone,
  };
}

interface ObservedExtras {
  visibilityMeters: number | null;
  dewPointF: number | null;
}

async function fetchCurrentConditions(
  observationStationsUrl: string,
): Promise<{ current: CurrentConditions; extras: ObservedExtras }> {
  const stationsRes = await fetch(observationStationsUrl, { headers: NWS_HEADERS });
  if (!stationsRes.ok) throw new Error(`NWS station lookup failed (${stationsRes.status})`);
  const stationsData = await stationsRes.json();
  const stationIds: string[] = (stationsData.features ?? [])
    .map((f: { properties?: { stationIdentifier?: string } }) => f.properties?.stationIdentifier)
    .filter((id: string | undefined): id is string => Boolean(id));
  if (stationIds.length === 0) throw new Error('No NWS observation station found nearby');

  // The nearest station's latest observation sometimes has a null
  // temperature (sensor outage, reporting gap, etc.) — fall through to the
  // next-nearest station instead of silently treating that as 0°C.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let p: any = null;
  for (const stationId of stationIds.slice(0, 5)) {
    const obsRes = await fetch(`https://api.weather.gov/stations/${stationId}/observations/latest`, {
      headers: NWS_HEADERS,
    });
    if (!obsRes.ok) continue;
    const obsData = await obsRes.json();
    const props = obsData.properties ?? {};
    if (props.temperature?.value != null) {
      p = props;
      break;
    }
  }
  if (!p) throw new Error('No nearby station has a current temperature reading');

  const temperatureC: number = p.temperature.value;
  const heatIndexC: number | null = p.heatIndex?.value ?? null;
  const windChillC: number | null = p.windChill?.value ?? null;
  const apparentC = heatIndexC ?? windChillC ?? temperatureC;
  const pressurePa: number | null = p.barometricPressure?.value ?? p.seaLevelPressure?.value ?? null;
  const precipMm: number | null = p.precipitationLastHour?.value ?? null;
  const visibilityM: number | null = p.visibility?.value ?? null;
  const dewpointC: number | null = p.dewpoint?.value ?? null;

  const current: CurrentConditions = {
    temperature: celsiusToFahrenheit(temperatureC),
    apparentTemperature: celsiusToFahrenheit(apparentC),
    humidity: p.relativeHumidity?.value ?? 0,
    windSpeed: p.windSpeed?.value != null ? kmhToMph(p.windSpeed.value) : 0,
    windGusts: p.windGust?.value != null ? kmhToMph(p.windGust.value) : 0,
    windDirection: p.windDirection?.value ?? 0,
    precipitation: precipMm != null ? precipMm / 25.4 : 0,
    weatherCode: mapNwsTextToWeatherCode(p.textDescription ?? ''),
    isDay: !String(p.icon ?? '').includes('/night/'),
    time: p.timestamp ?? new Date().toISOString(),
    pressure: pressurePa != null ? paToHpa(pressurePa) : 1013,
  };

  return {
    current,
    extras: {
      visibilityMeters: visibilityM,
      dewPointF: dewpointC != null ? celsiusToFahrenheit(dewpointC) : null,
    },
  };
}

async function fetchHourly(forecastHourlyUrl: string): Promise<HourlyPoint[]> {
  const res = await fetch(forecastHourlyUrl, { headers: NWS_HEADERS });
  if (!res.ok) throw new Error(`NWS hourly forecast fetch failed (${res.status})`);
  const data = await res.json();
  const periods: unknown[] = data.properties?.periods ?? [];

  return periods
    .map((raw) => {
      const p = raw as Record<string, unknown>;
      const pop = p.probabilityOfPrecipitation as { value?: number } | undefined;
      const dewpoint = p.dewpoint as { value?: number } | undefined;
      const point: HourlyPoint = {
        time: String(p.startTime ?? ''),
        temperature: Number(p.temperature ?? 0),
        precipitationProbability: pop?.value ?? 0,
        weatherCode: mapNwsTextToWeatherCode(String(p.shortForecast ?? '')),
        windGusts: parseGustMph(String(p.detailedForecast ?? '')) ?? parseWindMph(String(p.windSpeed ?? '')),
        uvIndex: 0,
        visibility: 0,
        dewPoint: dewpoint?.value != null ? celsiusToFahrenheit(dewpoint.value) : 0,
      };
      return point;
    })
    .filter((point) => point.time)
    .slice(0, 24);
}

interface NwsForecastPeriod {
  startTime: string;
  isDaytime: boolean;
  temperature: number;
  windSpeed: string;
  windDirection: string;
  shortForecast: string;
  detailedForecast: string;
  probabilityOfPrecipitation: number;
}

async function fetchDaily(forecastUrl: string, location: Location): Promise<DailyForecast[]> {
  const res = await fetch(forecastUrl, { headers: NWS_HEADERS });
  if (!res.ok) throw new Error(`NWS forecast fetch failed (${res.status})`);
  const data = await res.json();
  const rawPeriods: unknown[] = data.properties?.periods ?? [];

  const periods: NwsForecastPeriod[] = rawPeriods.map((raw) => {
    const p = raw as Record<string, unknown>;
    const pop = p.probabilityOfPrecipitation as { value?: number } | undefined;
    return {
      startTime: String(p.startTime ?? ''),
      isDaytime: Boolean(p.isDaytime),
      temperature: Number(p.temperature ?? 0),
      windSpeed: String(p.windSpeed ?? ''),
      windDirection: String(p.windDirection ?? ''),
      shortForecast: String(p.shortForecast ?? ''),
      detailedForecast: String(p.detailedForecast ?? ''),
      probabilityOfPrecipitation: pop?.value ?? 0,
    };
  });

  const byDate = new Map<string, { day?: NwsForecastPeriod; night?: NwsForecastPeriod }>();
  for (const period of periods) {
    const date = period.startTime.slice(0, 10);
    if (!date) continue;
    const entry = byDate.get(date) ?? {};
    if (period.isDaytime) entry.day = period;
    else entry.night = period;
    byDate.set(date, entry);
  }

  const windDirToDeg: Record<string, number> = {
    N: 0, NNE: 22.5, NE: 45, ENE: 67.5, E: 90, ESE: 112.5, SE: 135, SSE: 157.5,
    S: 180, SSW: 202.5, SW: 225, WSW: 247.5, W: 270, WNW: 292.5, NW: 315, NNW: 337.5,
  };

  return Array.from(byDate.entries())
    .slice(0, 7)
    .map(([date, { day, night }]) => {
      const primary = day ?? night;
      const tempMax = day?.temperature ?? night?.temperature ?? 0;
      const tempMin = night?.temperature ?? day?.temperature ?? 0;
      const windSpeedMax = Math.max(parseWindMph(day?.windSpeed), parseWindMph(night?.windSpeed));
      const gustFromText = parseGustMph(day?.detailedForecast) ?? parseGustMph(night?.detailedForecast);
      const precipitationProbability = Math.max(
        day?.probabilityOfPrecipitation ?? 0,
        night?.probabilityOfPrecipitation ?? 0,
      );
      const base = {
        date,
        weatherCode: mapNwsTextToWeatherCode(primary?.shortForecast ?? ''),
        tempMax,
        tempMin,
        precipitationProbability,
        windSpeedMax,
        windGustsMax: gustFromText ?? windSpeedMax,
        windDirection: windDirToDeg[day?.windDirection ?? night?.windDirection ?? 'N'] ?? 0,
        uvIndexMax: 0,
      };
      const noon = new Date(`${date}T12:00:00`);
      const { sunrise, sunset } = computeSunTimes(noon, location.latitude, location.longitude);
      return {
        ...base,
        sunrise: sunrise.toISOString(),
        sunset: sunset.toISOString(),
        risk: assessDailyRisk(base),
      };
    });
}

// Lightweight fetch for glanceable UI (saved-locations list) — just the current
// station reading, skipping the hourly/daily forecast fetches fetchWeather does.
export async function fetchQuickConditions(location: Location): Promise<CurrentConditions> {
  const point = await fetchPointMeta(location);
  const { current } = await fetchCurrentConditions(point.observationStations);
  return current;
}

export async function fetchWeather(location: Location): Promise<WeatherSnapshot> {
  const point = await fetchPointMeta(location);

  const [{ current, extras }, hourly, daily] = await Promise.all([
    fetchCurrentConditions(point.observationStations),
    fetchHourly(point.forecastHourly),
    fetchDaily(point.forecast, location),
  ]);

  // The hourly forecast doesn't carry visibility/dew point — patch the "now"
  // entry with the real station observation, which is more accurate anyway.
  if (hourly[0]) {
    if (extras.visibilityMeters != null) hourly[0].visibility = extras.visibilityMeters;
    if (extras.dewPointF != null) hourly[0].dewPoint = extras.dewPointF;
  }

  return { location, current, hourly, daily, fetchedAt: new Date().toISOString() };
}
