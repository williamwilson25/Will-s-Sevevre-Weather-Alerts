import { useState } from 'react';
import type { CSSProperties } from 'react';
import type { DailyForecast } from '../types';
import { describeWeatherCode } from '../utils/weatherCode';
import { degreesToCompass } from '../utils/compass';
import RiskBadge from './RiskBadge';
import WeatherIcon from './WeatherIcon';
import { ChevronDownIcon, DropletIcon } from './icons';

interface Props {
  daily: DailyForecast[];
  onAlertDay?: (day: DailyForecast) => void;
}

const RANGE_GRADIENT = 'linear-gradient(90deg, #60a5fa, #fbbf24, #f87171)';

function rangeBarStyle(day: DailyForecast, weekMin: number, weekSpan: number): CSSProperties {
  const leftPct = ((day.tempMin - weekMin) / weekSpan) * 100;
  const widthPct = Math.max(((day.tempMax - day.tempMin) / weekSpan) * 100, 6);
  const bgWidthPct = 10000 / widthPct;
  const bgPosPct = -(leftPct / widthPct) * 100;
  return {
    left: `${leftPct}%`,
    width: `${widthPct}%`,
    backgroundImage: RANGE_GRADIENT,
    backgroundSize: `${bgWidthPct}% 100%`,
    backgroundPositionX: `${bgPosPct}%`,
  };
}

export default function DailyForecastList({ daily, onAlertDay }: Props) {
  const [expandedDate, setExpandedDate] = useState<string | null>(daily[0]?.date ?? null);
  const weekMin = Math.min(...daily.map((d) => d.tempMin));
  const weekMax = Math.max(...daily.map((d) => d.tempMax));
  const weekSpan = Math.max(weekMax - weekMin, 1);

  return (
    <section className="daily-forecast">
      <h2>7-day forecast</h2>
      <ul className="daily-list">
        {daily.map((day, i) => {
          const { label } = describeWeatherCode(day.weatherCode);
          const dayLabel =
            i === 0
              ? 'Today'
              : new Date(`${day.date}T00:00:00`).toLocaleDateString(undefined, {
                  weekday: 'short',
                });
          const expanded = expandedDate === day.date;

          return (
            <li key={day.date} className={`daily-item risk-${day.risk.level}`}>
              <button
                type="button"
                className="daily-row"
                onClick={() => setExpandedDate(expanded ? null : day.date)}
                aria-expanded={expanded}
              >
                <div className="daily-day">{dayLabel}</div>
                <div className="daily-icon">
                  <WeatherIcon code={day.weatherCode} size={22} />
                </div>
                <div className="daily-main">
                  <div className="daily-label">{label}</div>
                  <span className="daily-precip">
                    <DropletIcon size={11} /> {Math.round(day.precipitationProbability)}%
                  </span>
                </div>
                <RiskBadge level={day.risk.level} score={day.risk.score} compact />
                <ChevronDownIcon size={16} className={`daily-chevron${expanded ? ' daily-chevron-open' : ''}`} />
              </button>

              <div className="daily-range-row">
                <span className="daily-min">{Math.round(day.tempMin)}°</span>
                <div className="daily-range-track">
                  <div className="daily-range-bar" style={rangeBarStyle(day, weekMin, weekSpan)} />
                </div>
                <span className="daily-max">{Math.round(day.tempMax)}°</span>
              </div>

              {expanded && (
                <div className="daily-detail">
                  <div className="daily-detail-heading">Tonight</div>
                  <p>
                    {label} overnight. Low near {Math.round(day.tempMin)}°. Wind{' '}
                    {degreesToCompass(day.windDirection)} at {Math.round(day.windSpeedMax)} mph with
                    gusts up to {Math.round(day.windGustsMax)} mph.
                  </p>
                  {onAlertDay && (
                    <button
                      type="button"
                      className="daily-alert-button"
                      onClick={() => onAlertDay(day)}
                      title="Draft an alert for this day"
                    >
                      Alert friends
                    </button>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
