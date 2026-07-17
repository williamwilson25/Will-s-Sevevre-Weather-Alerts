import { BellAlertIcon } from './icons';

interface Props {
  onEnable: () => void;
  onDismiss: () => void;
}

export default function EnableNotificationsBanner({ onEnable, onDismiss }: Props) {
  return (
    <div className="rain-soon-banner">
      <BellAlertIcon size={22} className="rain-soon-icon" />
      <div className="rain-soon-body">
        <div className="rain-soon-title">Get notified when rain starts</div>
        <div className="rain-soon-detail">
          Turn on alerts so you find out the moment rain is coming, without checking the app.
        </div>
      </div>
      <button type="button" className="rain-soon-notify" onClick={onEnable}>
        <BellAlertIcon size={14} /> Enable
      </button>
      <button type="button" className="rain-soon-dismiss" onClick={onDismiss} aria-label="Dismiss">
        ×
      </button>
    </div>
  );
}
