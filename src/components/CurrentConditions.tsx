import type { WeatherSnapshot } from '../types';
import { describeWeatherCode } from '../utils/weatherCode';
import WeatherIcon from './WeatherIcon';

interface Props {
  snapshot: WeatherSnapshot;
}

export default function CurrentConditions({ snapshot }: Props) {
  const { current, location, daily } = snapshot;
  const { label } = describeWeatherCode(current.weatherCode);
  const today = daily[0];

  return (
    <section className="hero">
      <div className="hero-location">
        {location.name}
        {location.admin1 ? `, ${location.admin1}` : ''}
      </div>
      <div className="hero-icon">
        <WeatherIcon code={current.weatherCode} isDay={current.isDay} size={88} />
      </div>
      <div className="hero-temp">{Math.round(current.temperature)}°</div>
      <div className="hero-label">{label}</div>
      {today && (
        <div className="hero-hilo">
          H:{Math.round(today.tempMax)}° L:{Math.round(today.tempMin)}°
        </div>
      )}
      <div className="hero-stats">
        <div className="hero-stat">
          <span className="hero-stat-label">Feels like</span>
          <span className="hero-stat-value">{Math.round(current.apparentTemperature)}°</span>
        </div>
        <div className="hero-stat">
          <span className="hero-stat-label">Humidity</span>
          <span className="hero-stat-value">{Math.round(current.humidity)}%</span>
        </div>
        <div className="hero-stat">
          <span className="hero-stat-label">Wind</span>
          <span className="hero-stat-value">{Math.round(current.windSpeed)} mph</span>
        </div>
        <div className="hero-stat">
          <span className="hero-stat-label">Gusts</span>
          <span className="hero-stat-value">{Math.round(current.windGusts)} mph</span>
        </div>
      </div>
    </section>
  );
}
