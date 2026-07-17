import type { WeatherSnapshot } from '../types';
import WeatherIcon from './WeatherIcon';
import { RefreshIcon } from './icons';

interface Props {
  snapshot: WeatherSnapshot;
  refreshing: boolean;
  onRefresh: () => void;
}

export default function StatusBar({ snapshot, refreshing, onRefresh }: Props) {
  const { current, location } = snapshot;
  return (
    <div className="status-bar">
      <WeatherIcon code={current.weatherCode} isDay={current.isDay} size={26} />
      <span className="status-bar-temp">{Math.round(current.temperature)}°</span>
      <span className="status-bar-location">
        {location.name}
        {location.admin1 ? `, ${location.admin1}` : ''}
      </span>
      <button
        type="button"
        className="status-bar-refresh"
        onClick={onRefresh}
        disabled={refreshing}
        aria-label="Refresh weather"
      >
        <RefreshIcon size={15} className={refreshing ? 'spin' : ''} />
      </button>
    </div>
  );
}
