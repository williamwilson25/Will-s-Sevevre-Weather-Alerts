export interface WeatherTheme {
  key: string;
  gradient: string;
}

const THUNDERSTORM_CODES = new Set([95, 96, 99]);
const SNOW_CODES = new Set([71, 73, 75, 77, 85, 86]);
const FOG_CODES = new Set([45, 48]);
const RAIN_CODES = new Set([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82]);
const OVERCAST_CODES = new Set([3]);
const CLOUDY_CODES = new Set([2]);
const MOSTLY_CLEAR_CODES = new Set([1]);

export function getWeatherTheme(weatherCode: number, isDay: boolean): WeatherTheme {
  if (THUNDERSTORM_CODES.has(weatherCode)) {
    return {
      key: 'storm',
      gradient: 'linear-gradient(165deg, #1e1b3f 0%, #3b1264 45%, #5b1a8c 100%)',
    };
  }
  if (SNOW_CODES.has(weatherCode)) {
    return {
      key: 'snow',
      gradient: isDay
        ? 'linear-gradient(165deg, #4a6fa5 0%, #7ba3d0 55%, #b8d4ea 100%)'
        : 'linear-gradient(165deg, #16213e 0%, #2c3e6b 55%, #4a5f8f 100%)',
    };
  }
  if (RAIN_CODES.has(weatherCode)) {
    return {
      key: 'rain',
      gradient: isDay
        ? 'linear-gradient(165deg, #2c3e5c 0%, #445b7d 55%, #5f7a9e 100%)'
        : 'linear-gradient(165deg, #0f1a2e 0%, #1e2f4d 55%, #34486d 100%)',
    };
  }
  if (FOG_CODES.has(weatherCode)) {
    return {
      key: 'fog',
      gradient: isDay
        ? 'linear-gradient(165deg, #4b5568 0%, #6b7688 55%, #8b96a8 100%)'
        : 'linear-gradient(165deg, #1c2230 0%, #333c4f 55%, #4a5468 100%)',
    };
  }
  if (OVERCAST_CODES.has(weatherCode)) {
    return {
      key: 'overcast',
      gradient: isDay
        ? 'linear-gradient(165deg, #3d4c63 0%, #5b6d87 55%, #7f92ab 100%)'
        : 'linear-gradient(165deg, #131a2b 0%, #263449 55%, #3c4c66 100%)',
    };
  }
  if (CLOUDY_CODES.has(weatherCode) || MOSTLY_CLEAR_CODES.has(weatherCode)) {
    return {
      key: 'cloudy',
      gradient: isDay
        ? 'linear-gradient(165deg, #2f6fa8 0%, #4f8fc4 55%, #85b8dd 100%)'
        : 'linear-gradient(165deg, #101b31 0%, #1f3050 55%, #33496e 100%)',
    };
  }
  return {
    key: 'clear',
    gradient: isDay
      ? 'linear-gradient(165deg, #1a6fc4 0%, #3d94dd 50%, #7ec3ee 100%)'
      : 'linear-gradient(165deg, #0a1128 0%, #131c3d 50%, #232f57 100%)',
  };
}

export const DEFAULT_THEME: WeatherTheme = {
  key: 'default',
  gradient: 'linear-gradient(165deg, #0b1220 0%, #131c30 100%)',
};
