import type { DailyForecast } from '../types';
import { describeWeatherCode } from '../utils/weatherCode';
import RiskBadge from './RiskBadge';

interface Props {
  daily: DailyForecast[];
  onAlertDay?: (day: DailyForecast) => void;
}

export default function DailyForecastList({ daily, onAlertDay }: Props) {
  return (
    <section className="daily-forecast">
      <h2>7-day forecast</h2>
      <ul className="daily-list">
        {daily.map((day, i) => {
          const { label, icon } = describeWeatherCode(day.weatherCode);
          const dayLabel =
            i === 0
              ? 'Today'
              : new Date(`${day.date}T00:00:00`).toLocaleDateString(undefined, {
                  weekday: 'short',
                });
          return (
            <li key={day.date} className={`daily-item risk-${day.risk.level}`}>
              <div className="daily-day">{dayLabel}</div>
              <div className="daily-icon" aria-hidden="true">
                {icon}
              </div>
              <div className="daily-label">{label}</div>
              <div className="daily-temps">
                <span className="daily-max">{Math.round(day.tempMax)}°</span>
                <span className="daily-min">{Math.round(day.tempMin)}°</span>
              </div>
              <RiskBadge level={day.risk.level} score={day.risk.score} />
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
            </li>
          );
        })}
      </ul>
    </section>
  );
}
