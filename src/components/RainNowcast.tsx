import { useEffect, useRef, useState } from 'react';
import type { HourlyPoint, Location } from '../types';
import { buildNwsNowcast, summarizeNowcast, type NowcastPoint, type NowcastState } from '../utils/nowcast';

interface Props {
  location: Location;
  hourly: HourlyPoint[];
  onSummary?: (summary: NowcastState, locationId: string) => void;
}

function minuteLabel(minutes: number): string {
  if (minutes <= 0) return 'Now';
  return `${minutes}m`;
}

export default function RainNowcast({ location, hourly, onSummary }: Props) {
  const [points, setPoints] = useState<NowcastPoint[] | null>(null);
  const prevLocationId = useRef(location.id);

  useEffect(() => {
    if (prevLocationId.current !== location.id) {
      prevLocationId.current = location.id;
      setPoints(null);
    }
    const pts = buildNwsNowcast(hourly);
    setPoints(pts);
    onSummary?.(summarizeNowcast(pts), location.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.id, hourly]);

  if (!points) {
    return (
      <section className="nowcast-card">
        <p className="empty-state">Checking short-term rain…</p>
      </section>
    );
  }

  const summary = summarizeNowcast(points);
  const title =
    summary.kind === 'raining' ? 'Rain Expected' : summary.kind === 'starting' ? 'Rain Forecasted' : 'No Rain Expected';
  const detail =
    summary.kind === 'raining'
      ? 'Rain is happening now and expected to continue.'
      : summary.kind === 'starting'
        ? `Rain is expected to start in ${summary.minutesAway} min.`
        : 'No precipitation expected in the next hour.';

  const maxIntensity = Math.max(...points.map((p) => p.intensity), 20);

  return (
    <section className={`nowcast-card nowcast-${summary.kind}`}>
      <h2 className="nowcast-title">{title}</h2>
      <p className="nowcast-detail">{detail}</p>
      <div className="nowcast-chart">
        {points.map((p, i) => (
          <div className="nowcast-bar-col" key={i}>
            <div className="nowcast-bar-track">
              <div
                className="nowcast-bar"
                style={{ height: `${Math.max((p.intensity / maxIntensity) * 100, p.intensity > 0 ? 6 : 0)}%` }}
              />
            </div>
            <span className="nowcast-bar-label">{minuteLabel(p.minutesFromNow)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
