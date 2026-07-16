import { categorizeWeather } from '../utils/weatherCategory';
import {
  CloudFogIcon,
  CloudIcon,
  CloudLightningIcon,
  CloudMoonIcon,
  CloudRainIcon,
  CloudSnowIcon,
  CloudSunIcon,
  CloudsIcon,
  MoonIcon,
  SunIcon,
} from './icons';

interface Props {
  code: number;
  isDay?: boolean;
  size?: number;
  className?: string;
}

export default function WeatherIcon({ code, isDay = true, size = 24, className }: Props) {
  const category = categorizeWeather(code);

  switch (category) {
    case 'storm':
      return <CloudLightningIcon size={size} className={className} />;
    case 'snow':
      return <CloudSnowIcon size={size} className={className} />;
    case 'rain':
      return <CloudRainIcon size={size} className={className} />;
    case 'fog':
      return <CloudFogIcon size={size} className={className} />;
    case 'overcast':
      return <CloudsIcon size={size} className={className} />;
    case 'cloudy':
      return <CloudIcon size={size} className={className} />;
    case 'mostlyClear':
      return isDay ? (
        <CloudSunIcon size={size} className={className} />
      ) : (
        <CloudMoonIcon size={size} className={className} />
      );
    default:
      return isDay ? <SunIcon size={size} className={className} /> : <MoonIcon size={size} className={className} />;
  }
}
