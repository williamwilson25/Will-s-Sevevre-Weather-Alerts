import type {
  CurrentConditions,
  DailyForecast,
  HourlyPoint,
  Location,
  WeatherSnapshot,
} from '../types';
import { assessDailyRisk } from '../utils/severity';

const GEOCODE_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';

interface GeocodeResult {
  id: number;
  name: string;
  admin1?: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

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

export async function fetchWeather(location: Location): Promise<WeatherSnapshot> {
  const url = new URL(FORECAST_URL);
  url.searchParams.set('latitude', String(location.latitude));
  url.searchParams.set('longitude', String(location.longitude));
  url.searchParams.set('timezone', location.timezone || 'auto');
  url.searchParams.set(
    'current',
    [
      'temperature_2m',
      'apparent_temperature',
      'relative_humidity_2m',
      'wind_speed_10m',
      'wind_gusts_10m',
      'wind_direction_10m',
      'precipitation',
      'weather_code',
      'is_day',
      'surface_pressure',
    ].join(','),
  );
  url.searchParams.set(
    'hourly',
    [
      'temperature_2m',
      'precipitation_probability',
      'weather_code',
      'wind_gusts_10m',
      'uv_index',
      'visibility',
      'dew_point_2m',
    ].join(','),
  );
  url.searchParams.set(
    'daily',
    [
      'weather_code',
      'temperature_2m_max',
      'temperature_2m_min',
      'precipitation_probability_max',
      'wind_speed_10m_max',
      'wind_gusts_10m_max',
      'wind_direction_10m_dominant',
      'uv_index_max',
      'sunrise',
      'sunset',
    ].join(','),
  );
  url.searchParams.set('forecast_days', '7');
  url.searchParams.set('wind_speed_unit', 'mph');
  url.searchParams.set('temperature_unit', 'fahrenheit');
  url.searchParams.set('precipitation_unit', 'inch');

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Weather fetch failed (${res.status})`);
  const data = await res.json();

  const current: CurrentConditions = {
    temperature: data.current.temperature_2m,
    apparentTemperature: data.current.apparent_temperature,
    humidity: data.current.relative_humidity_2m,
    windSpeed: data.current.wind_speed_10m,
    windGusts: data.current.wind_gusts_10m,
    windDirection: data.current.wind_direction_10m,
    precipitation: data.current.precipitation,
    weatherCode: data.current.weather_code,
    isDay: data.current.is_day === 1,
    time: data.current.time,
    pressure: data.current.surface_pressure,
  };

  const hourly: HourlyPoint[] = data.hourly.time
    .map((time: string, i: number) => ({
      time,
      temperature: data.hourly.temperature_2m[i],
      precipitationProbability: data.hourly.precipitation_probability[i],
      weatherCode: data.hourly.weather_code[i],
      windGusts: data.hourly.wind_gusts_10m[i],
      uvIndex: data.hourly.uv_index[i],
      visibility: data.hourly.visibility[i],
      dewPoint: data.hourly.dew_point_2m[i],
    }))
    .filter((point: HourlyPoint) => new Date(point.time).getTime() >= Date.now() - 60 * 60 * 1000)
    .slice(0, 24);

  const daily: DailyForecast[] = data.daily.time.map((date: string, i: number) => {
    const base = {
      date,
      weatherCode: data.daily.weather_code[i],
      tempMax: data.daily.temperature_2m_max[i],
      tempMin: data.daily.temperature_2m_min[i],
      precipitationProbability: data.daily.precipitation_probability_max[i],
      windSpeedMax: data.daily.wind_speed_10m_max[i],
      windGustsMax: data.daily.wind_gusts_10m_max[i],
      windDirection: data.daily.wind_direction_10m_dominant[i],
      uvIndexMax: data.daily.uv_index_max[i],
      sunrise: data.daily.sunrise[i],
      sunset: data.daily.sunset[i],
    };
    return { ...base, risk: assessDailyRisk(base) };
  });

  return { location, current, hourly, daily, fetchedAt: new Date().toISOString() };
}
