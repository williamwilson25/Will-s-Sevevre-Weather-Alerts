import type { HourlyPoint } from '../types';
import { describeWeatherCode } from '../utils/weatherCode';

interface Props {
  hourly: HourlyPoint[];
}

export default function HourlyStrip({ hourly }: Props) {
  if (hourly.length === 0) return null;

  const temps = hourly.map((h) => h.temperature);
  const min = Math.min(...temps);
  const max = Math.max(...temps);
  const range = Math.max(max - min, 1);

  return (
    <section className="hourly-strip">
      <h2>Next 24 hours</h2>
      <div className="hourly-scroll">
        {hourly.map((point) => {
          const { icon } = describeWeatherCode(point.weatherCode);
          const heightPct = 20 + ((point.temperature - min) / range) * 60;
          return (
            <div className="hourly-item" key={point.time}>
              <span className="hourly-time">
                {new Date(point.time).toLocaleTimeString(undefined, { hour: 'numeric' })}
              </span>
              <span className="hourly-icon" aria-hidden="true">
                {icon}
              </span>
              <div className="hourly-bar-track">
                <div className="hourly-bar" style={{ height: `${heightPct}%` }} />
              </div>
              <span className="hourly-temp">{Math.round(point.temperature)}°</span>
              {point.precipitationProbability >= 30 && (
                <span className="hourly-precip">💧{Math.round(point.precipitationProbability)}%</span>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
