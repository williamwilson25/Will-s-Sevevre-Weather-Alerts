import type { CSSProperties } from 'react';
import type { DailyForecast } from '../types';
import { describeWeatherCode } from '../utils/weatherCode';
import RiskBadge from './RiskBadge';
import WeatherIcon from './WeatherIcon';

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
          return (
            <li key={day.date} className={`daily-item risk-${day.risk.level}`}>
              <div className="daily-row">
                <div className="daily-day">{dayLabel}</div>
                <div className="daily-icon">
                  <WeatherIcon code={day.weatherCode} size={22} />
                </div>
                <div className="daily-label">{label}</div>
                <RiskBadge level={day.risk.level} score={day.risk.score} compact />
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
              <div className="daily-range-row">
                <span className="daily-min">{Math.round(day.tempMin)}°</span>
                <div className="daily-range-track">
                  <div className="daily-range-bar" style={rangeBarStyle(day, weekMin, weekSpan)} />
                </div>
                <span className="daily-max">{Math.round(day.tempMax)}°</span>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
