import { useEffect, useState } from 'react';
import type { Location } from '../types';
import { pushSupported, subscribeToPush, unsubscribeFromPush } from '../api/pushSubscriptions';
import ToggleSwitch from './ToggleSwitch';

interface Props {
  uid: string;
  locations: Location[];
  mutedLocationIds: string[];
  alertTypePrefs: Record<string, boolean>;
}

export default function PushNotificationToggle({
  uid,
  locations,
  mutedLocationIds,
  alertTypePrefs,
}: Props) {
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!pushSupported()) return;
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setSubscribed(Boolean(sub)))
      .catch(() => {});
  }, []);

  async function handleChange(checked: boolean) {
    setError('');
    setBusy(true);
    try {
      if (checked) {
        if (Notification.permission !== 'granted') {
          const perm = await Notification.requestPermission();
          if (perm !== 'granted') {
            setError('Notifications were blocked — allow them in your browser/OS settings to enable this.');
            setBusy(false);
            return;
          }
        }
        await subscribeToPush(uid, { locations, mutedLocationIds, alertTypePrefs });
        setSubscribed(true);
      } else {
        await unsubscribeFromPush(uid);
        setSubscribed(false);
      }
    } catch {
      setError('Something went wrong — try again in a moment.');
    } finally {
      setBusy(false);
    }
  }

  if (!pushSupported()) {
    return (
      <div className="settings-row settings-row-static">
        <span className="settings-row-label">Always-On Alerts</span>
        <span className="settings-row-value">Unsupported in this browser</span>
      </div>
    );
  }

  return (
    <div className="push-toggle-row">
      <div className="push-toggle-text">
        <span className="settings-row-label">Always-On Alerts</span>
        <span className="push-toggle-caption">
          Get severe weather alerts even when the app is closed.
        </span>
      </div>
      <ToggleSwitch
        label="Always-on push alerts"
        checked={subscribed}
        onChange={handleChange}
        disabled={busy}
      />
      {error && <p className="form-error push-toggle-error">{error}</p>}
    </div>
  );
}
