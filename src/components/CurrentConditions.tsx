import { useEffect, useState } from 'react';
import type { WeatherSnapshot } from '../types';
import { describeWeatherCode } from '../utils/weatherCode';
import { formatTimeAgo } from '../utils/time';
import WeatherIcon from './WeatherIcon';
import { DropletIcon, RefreshIcon } from './icons';

interface Props {
  snapshot: WeatherSnapshot;
  refreshing: boolean;
  onRefresh: () => void;
}

export default function CurrentConditions({ snapshot, refreshing, onRefresh }: Props) {
  const { current, location, daily, hourly, fetchedAt } = snapshot;
  const { label } = describeWeatherCode(current.weatherCode);
  const today = daily[0];
  const rainChance = hourly[0]?.precipitationProbability ?? today?.precipitationProbability ?? 0;

  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick((n) => n + 1), 30 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="hero">
      <div className="hero-location">
        {location.name}
        {location.admin1 ? `, ${location.admin1}` : ''}
      </div>
      <button type="button" className="hero-updated" onClick={onRefresh} disabled={refreshing}>
        <RefreshIcon size={12} className={refreshing ? 'spin' : ''} />
        {refreshing ? 'Updating…' : `Updated ${formatTimeAgo(fetchedAt)}`}
      </button>
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
          <span className="hero-stat-label">
            <DropletIcon size={11} /> Rain chance
          </span>
          <span className="hero-stat-value">{Math.round(rainChance)}%</span>
        </div>
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
