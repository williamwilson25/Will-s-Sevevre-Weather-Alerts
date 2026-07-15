import type { WeatherSnapshot } from '../types';
import { describeWeatherCode } from '../utils/weatherCode';

interface Props {
  snapshot: WeatherSnapshot;
}

export default function CurrentConditions({ snapshot }: Props) {
  const { current, location } = snapshot;
  const { label, icon } = describeWeatherCode(current.weatherCode);

  return (
    <section className="current-conditions">
      <div className="current-main">
        <div className="current-icon" aria-hidden="true">
          {icon}
        </div>
        <div>
          <div className="current-temp">{Math.round(current.temperature)}°F</div>
          <div className="current-label">{label}</div>
          <div className="current-location">
            {location.name}
            {location.admin1 ? `, ${location.admin1}` : ''}
          </div>
        </div>
      </div>
      <dl className="current-stats">
        <div>
          <dt>Feels like</dt>
          <dd>{Math.round(current.apparentTemperature)}°F</dd>
        </div>
        <div>
          <dt>Humidity</dt>
          <dd>{Math.round(current.humidity)}%</dd>
        </div>
        <div>
          <dt>Wind</dt>
          <dd>{Math.round(current.windSpeed)} mph</dd>
        </div>
        <div>
          <dt>Gusts</dt>
          <dd>{Math.round(current.windGusts)} mph</dd>
        </div>
      </dl>
    </section>
  );
}
