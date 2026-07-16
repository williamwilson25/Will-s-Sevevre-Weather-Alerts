import type { DailyForecast } from '../types';
import { RISK_LABEL } from '../utils/severity';
import RiskBadge from './RiskBadge';
import { AlertTriangleIcon, CheckCircleIcon } from './icons';

interface Props {
  daily: DailyForecast[];
  onAlertDay?: (day: DailyForecast) => void;
}

export default function SevereWeatherBanner({ daily, onAlertDay }: Props) {
  const next = daily.find((d) => d.risk.level === 'high' || d.risk.level === 'severe');

  if (!next) {
    return (
      <div className="severe-banner severe-banner-calm">
        <span className="severe-banner-icon severe-banner-icon-calm">
          <CheckCircleIcon size={22} />
        </span>
        <div>
          <strong>No severe weather expected</strong>
          <p>The next 7 days look calm for this location.</p>
        </div>
      </div>
    );
  }

  const dateLabel = new Date(`${next.date}T00:00:00`).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className={`severe-banner severe-banner-${next.risk.level}`}>
      <span className="severe-banner-icon">
        <AlertTriangleIcon size={22} />
      </span>
      <div className="severe-banner-body">
        <strong>
          Next chance of severe weather: {dateLabel} — {RISK_LABEL[next.risk.level]}
        </strong>
        <p>{next.risk.reasons.join('; ')}</p>
        <RiskBadge level={next.risk.level} score={next.risk.score} />
      </div>
      {onAlertDay && (
        <button type="button" className="severe-banner-button" onClick={() => onAlertDay(next)}>
          Alert my friends
        </button>
      )}
    </div>
  );
}
