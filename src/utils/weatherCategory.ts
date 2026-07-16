export type WeatherCategory =
  | 'clear'
  | 'mostlyClear'
  | 'cloudy'
  | 'overcast'
  | 'fog'
  | 'rain'
  | 'snow'
  | 'storm';

const STORM_CODES = new Set([95, 96, 99]);
const SNOW_CODES = new Set([71, 73, 75, 77, 85, 86]);
const FOG_CODES = new Set([45, 48]);
const RAIN_CODES = new Set([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82]);
const OVERCAST_CODES = new Set([3]);
const CLOUDY_CODES = new Set([2]);
const MOSTLY_CLEAR_CODES = new Set([1]);

export function categorizeWeather(code: number): WeatherCategory {
  if (STORM_CODES.has(code)) return 'storm';
  if (SNOW_CODES.has(code)) return 'snow';
  if (RAIN_CODES.has(code)) return 'rain';
  if (FOG_CODES.has(code)) return 'fog';
  if (OVERCAST_CODES.has(code)) return 'overcast';
  if (CLOUDY_CODES.has(code)) return 'cloudy';
  if (MOSTLY_CLEAR_CODES.has(code)) return 'mostlyClear';
  return 'clear';
}
