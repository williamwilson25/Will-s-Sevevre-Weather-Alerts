import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import type { Location } from '../types';
import { fetchActiveAlerts, type NwsAlert, type NwsSeverity } from '../api/nwsAlerts';
import { AlertTriangleIcon, ChevronDownIcon } from './icons';

interface Props {
  location: Location;
}

const SEVERITY_COLOR: Record<NwsSeverity, string> = {
  Extreme: '#ef4444',
  Severe: '#f97316',
  Moderate: '#eab308',
  Minor: '#7dd3fc',
  Unknown: '#7dd3fc',
};

function formatExpiry(iso: string): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export default function ActiveAlerts({ location }: Props) {
  const [alerts, setAlerts] = useState<NwsAlert[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    function load() {
      fetchActiveAlerts(location)
        .then((data) => {
          if (!cancelled) setAlerts(data);
        })
        .catch(() => {
          // silent — a failed check shouldn't break the rest of the app, and
          // official warnings are always available directly from weather.gov
        });
    }

    load();
    const interval = setInterval(load, 2 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [location.id]);

  if (alerts.length === 0) return null;

  return (
    <section className="nws-alerts">
      <h2>Active NWS alerts</h2>
      <ul className="nws-alert-list">
        {alerts.map((alert) => {
          const expanded = expandedId === alert.id;
          const color = SEVERITY_COLOR[alert.severity] ?? SEVERITY_COLOR.Unknown;
          return (
            <li
              key={alert.id}
              className="nws-alert-item"
              data-severity={alert.severity}
              style={{ '--nws-color': color } as CSSProperties}
            >
              <button
                type="button"
                className="nws-alert-row"
                onClick={() => setExpandedId(expanded ? null : alert.id)}
                aria-expanded={expanded}
              >
                <AlertTriangleIcon size={20} className="nws-alert-icon" />
                <div className="nws-alert-main">
                  <div className="nws-alert-event">{alert.event}</div>
                  <div className="nws-alert-meta">
                    {alert.senderName}
                    {alert.expires && ` · Until ${formatExpiry(alert.expires)}`}
                  </div>
                </div>
                <ChevronDownIcon
                  size={16}
                  className={`nws-alert-chevron${expanded ? ' nws-alert-chevron-open' : ''}`}
                />
              </button>
              {expanded && (
                <div className="nws-alert-detail">
                  {alert.areaDesc && <p className="nws-alert-area">{alert.areaDesc}</p>}
                  <p>{alert.instruction || alert.description}</p>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
