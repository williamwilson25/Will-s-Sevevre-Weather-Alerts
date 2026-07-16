import type { RainOnset } from '../utils/rainOnset';
import { formatOnsetTime } from '../utils/rainOnset';
import { DropletIcon, BellAlertIcon } from './icons';

interface Props {
  onset: RainOnset;
  notifyEnabled: boolean;
  notifySupported: boolean;
  notifyDenied: boolean;
  onEnableNotify: () => void;
  onDismiss: () => void;
}

export default function RainSoonBanner({
  onset,
  notifyEnabled,
  notifySupported,
  notifyDenied,
  onEnableNotify,
  onDismiss,
}: Props) {
  const timeLabel = formatOnsetTime(onset.hour.time);
  const whenLabel = onset.hoursAway === 1 ? 'within the hour' : `in about ${onset.hoursAway} hours`;

  return (
    <div className="rain-soon-banner">
      <DropletIcon size={22} className="rain-soon-icon" />
      <div className="rain-soon-body">
        <div className="rain-soon-title">Rain expected to start soon</div>
        <div className="rain-soon-detail">
          {Math.round(onset.hour.precipitationProbability)}% chance around {timeLabel} ({whenLabel})
        </div>
      </div>
      {notifySupported && !notifyEnabled && !notifyDenied && (
        <button type="button" className="rain-soon-notify" onClick={onEnableNotify}>
          <BellAlertIcon size={14} /> Notify me
        </button>
      )}
      <button type="button" className="rain-soon-dismiss" onClick={onDismiss} aria-label="Dismiss">
        ×
      </button>
    </div>
  );
}
