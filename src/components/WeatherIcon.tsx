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
  const glyphSize = Math.round(size * 0.62);

  const glyph = (() => {
    switch (category) {
      case 'storm':
        return <CloudLightningIcon size={glyphSize} />;
      case 'snow':
        return <CloudSnowIcon size={glyphSize} />;
      case 'rain':
        return <CloudRainIcon size={glyphSize} />;
      case 'fog':
        return <CloudFogIcon size={glyphSize} />;
      case 'overcast':
        return <CloudsIcon size={glyphSize} />;
      case 'cloudy':
        return <CloudIcon size={glyphSize} />;
      case 'mostlyClear':
        return isDay ? <CloudSunIcon size={glyphSize} /> : <CloudMoonIcon size={glyphSize} />;
      default:
        return isDay ? <SunIcon size={glyphSize} /> : <MoonIcon size={glyphSize} />;
    }
  })();

  return (
    <span
      className={`weather-icon-bezel${className ? ` ${className}` : ''}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {glyph}
    </span>
  );
}
