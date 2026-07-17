import { useEffect, useState } from 'react';
import type { WeatherSnapshot } from '../types';
import { describeWeatherCode } from '../utils/weatherCode';
import { formatTimeAgo } from '../utils/time';
import WeatherIcon from './WeatherIcon';
import {
  RefreshIcon,
  DropletIcon,
  WindIcon,
  GaugeIcon,
  EyeIcon,
  SunriseIcon,
  SunsetIcon,
  SunIcon,
  ThermometerIcon,
  BellAlertIcon,
} from './icons';

interface Props {
  snapshot: WeatherSnapshot;
  refreshing: boolean;
  onRefresh: () => void;
  notifyRain: boolean;
  notifySupported: boolean;
  notifyDenied: boolean;
  onEnableNotify: () => void;
  onTestNotify: () => void;
}

function formatClockTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

function metersToMiles(m: number): number {
  return m / 1609.34;
}

export default function CurrentConditions({
  snapshot,
  refreshing,
  onRefresh,
  notifyRain,
  notifySupported,
  notifyDenied,
  onEnableNotify,
  onTestNotify,
}: Props) {
  const { current, location, daily, hourly, fetchedAt } = snapshot;
  const { label } = describeWeatherCode(current.weatherCode);
  const today = daily[0];
  const nowHour = hourly[0];
  const rainChance = nowHour?.precipitationProbability ?? today?.precipitationProbability ?? 0;

  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick((n) => n + 1), 30 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <section className="hero">
        <div className="hero-location">
          {location.name}
          {location.admin1 ? `, ${location.admin1}` : ''}
        </div>
        <div className="hero-actions">
          <button type="button" className="hero-updated" onClick={onRefresh} disabled={refreshing}>
            <RefreshIcon size={12} className={refreshing ? 'spin' : ''} />
            {refreshing ? 'Updating…' : `Updated ${formatTimeAgo(fetchedAt)}`}
          </button>
          {notifySupported && !notifyDenied && (
            <button
              type="button"
              className="hero-updated"
              onClick={notifyRain ? onTestNotify : onEnableNotify}
              title={notifyRain ? 'Send a test rain alert' : 'Turn on rain alerts'}
            >
              <BellAlertIcon size={12} />
              {notifyRain ? 'Test alert' : 'Enable rain alerts'}
            </button>
          )}
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
      </section>

      <section className="conditions-card">
        <h2>Current conditions</h2>
        <div className="conditions-grid">
          <div className="condition-cell">
            <DropletIcon size={14} className="condition-icon" />
            <span className="condition-label">Rain chance</span>
            <span className="condition-value">{Math.round(rainChance)}%</span>
          </div>
          <div className="condition-cell">
            <ThermometerIcon size={14} className="condition-icon" />
            <span className="condition-label">Feels like</span>
            <span className="condition-value">{Math.round(current.apparentTemperature)}°</span>
          </div>
          <div className="condition-cell">
            <DropletIcon size={14} className="condition-icon" />
            <span className="condition-label">Humidity</span>
            <span className="condition-value">{Math.round(current.humidity)}%</span>
          </div>
          <div className="condition-cell">
            <WindIcon size={14} className="condition-icon" />
            <span className="condition-label">Wind</span>
            <span className="condition-value">{Math.round(current.windSpeed)} mph</span>
          </div>
          <div className="condition-cell">
            <WindIcon size={14} className="condition-icon" />
            <span className="condition-label">Gusts</span>
            <span className="condition-value">{Math.round(current.windGusts)} mph</span>
          </div>
          <div className="condition-cell">
            <SunIcon size={14} className="condition-icon" />
            <span className="condition-label">UV index</span>
            <span className="condition-value">{Math.round(nowHour?.uvIndex ?? 0)}</span>
          </div>
          <div className="condition-cell">
            <GaugeIcon size={14} className="condition-icon" />
            <span className="condition-label">Pressure</span>
            <span className="condition-value">{Math.round(current.pressure)} hPa</span>
          </div>
          <div className="condition-cell">
            <EyeIcon size={14} className="condition-icon" />
            <span className="condition-label">Visibility</span>
            <span className="condition-value">
              {Math.round(metersToMiles(nowHour?.visibility ?? 0))} mi
            </span>
          </div>
          <div className="condition-cell">
            <DropletIcon size={14} className="condition-icon" />
            <span className="condition-label">Dew point</span>
            <span className="condition-value">{Math.round(nowHour?.dewPoint ?? 0)}°</span>
          </div>
          {today && (
            <>
              <div className="condition-cell">
                <SunriseIcon size={14} className="condition-icon" />
                <span className="condition-label">Sunrise</span>
                <span className="condition-value">{formatClockTime(today.sunrise)}</span>
              </div>
              <div className="condition-cell">
                <SunsetIcon size={14} className="condition-icon" />
                <span className="condition-label">Sunset</span>
                <span className="condition-value">{formatClockTime(today.sunset)}</span>
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
}
