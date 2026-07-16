import { categorizeWeather } from './weatherCategory';

export interface WeatherTheme {
  key: string;
  gradient: string;
}

const GRADIENTS: Record<string, { day: string; night: string }> = {
  storm: {
    day: 'linear-gradient(165deg, #1e1b3f 0%, #3b1264 45%, #5b1a8c 100%)',
    night: 'linear-gradient(165deg, #15122b 0%, #2c0e4a 45%, #451469 100%)',
  },
  snow: {
    day: 'linear-gradient(165deg, #4a6fa5 0%, #7ba3d0 55%, #b8d4ea 100%)',
    night: 'linear-gradient(165deg, #16213e 0%, #2c3e6b 55%, #4a5f8f 100%)',
  },
  rain: {
    day: 'linear-gradient(165deg, #2c3e5c 0%, #445b7d 55%, #5f7a9e 100%)',
    night: 'linear-gradient(165deg, #0f1a2e 0%, #1e2f4d 55%, #34486d 100%)',
  },
  fog: {
    day: 'linear-gradient(165deg, #4b5568 0%, #6b7688 55%, #8b96a8 100%)',
    night: 'linear-gradient(165deg, #1c2230 0%, #333c4f 55%, #4a5468 100%)',
  },
  overcast: {
    day: 'linear-gradient(165deg, #3d4c63 0%, #5b6d87 55%, #7f92ab 100%)',
    night: 'linear-gradient(165deg, #131a2b 0%, #263449 55%, #3c4c66 100%)',
  },
  cloudy: {
    day: 'linear-gradient(165deg, #2f6fa8 0%, #4f8fc4 55%, #85b8dd 100%)',
    night: 'linear-gradient(165deg, #101b31 0%, #1f3050 55%, #33496e 100%)',
  },
  mostlyClear: {
    day: 'linear-gradient(165deg, #2f6fa8 0%, #4f8fc4 55%, #85b8dd 100%)',
    night: 'linear-gradient(165deg, #101b31 0%, #1f3050 55%, #33496e 100%)',
  },
  clear: {
    day: 'linear-gradient(165deg, #1a6fc4 0%, #3d94dd 50%, #7ec3ee 100%)',
    night: 'linear-gradient(165deg, #0a1128 0%, #131c3d 50%, #232f57 100%)',
  },
};

export function getWeatherTheme(weatherCode: number, isDay: boolean): WeatherTheme {
  const category = categorizeWeather(weatherCode);
  const gradients = GRADIENTS[category];
  return { key: category, gradient: isDay ? gradients.day : gradients.night };
}

export const DEFAULT_THEME: WeatherTheme = {
  key: 'default',
  gradient: 'linear-gradient(165deg, #0b1220 0%, #131c30 100%)',
};
