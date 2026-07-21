import { useEffect, useRef, useState } from 'react';
import type { Location } from '../types';
import { fetchNearbyStormCells, type StormCell } from '../api/stormCells';
import { TornadoIcon, HailIcon, WindIcon } from './icons';

interface Props {
  location: Location;
}

const REFRESH_MS = 5 * 60 * 1000;

export default function StormTrackerCard({ location }: Props) {
  const [cells, setCells] = useState<StormCell[] | null>(null);
  const locationId = useRef(location.id);

  useEffect(() => {
    if (locationId.current !== location.id) {
      locationId.current = location.id;
      setCells(null);
    }

    let cancelled = false;
    const load = () => {
      fetchNearbyStormCells(location.latitude, location.longitude).then((result) => {
        if (!cancelled) setCells(result);
      });
    };
    load();
    const interval = setInterval(load, REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [location.id, location.latitude, location.longitude]);

  // Quiet on calm days — same "hide rather than show an empty card" pattern
  // as StormArrivalTimer, so this doesn't add clutter when nothing's nearby.
  if (!cells || cells.length === 0) return null;

  return (
    <section className="storm-tracker-card">
      <h2>
        <TornadoIcon size={18} /> Nearby Storm Cells
      </h2>
      <ul className="storm-cell-list">
        {cells.map((cell) => (
          <li key={cell.id} className="storm-cell-row">
            <div className="storm-cell-main">
              <span className="storm-cell-distance">
                {cell.distanceMi != null ? `${cell.distanceMi} mi` : 'Nearby'}
                {cell.bearing ? ` ${cell.bearing}` : ''}
              </span>
              {cell.etaMinutes != null && (
                <span className="storm-cell-eta">~{cell.etaMinutes} min to you</span>
              )}
            </div>
            <div className="storm-cell-badges">
              {cell.speedMph != null && (
                <span className="storm-cell-badge storm-cell-badge-speed">
                  <WindIcon size={13} /> {cell.speedMph} mph
                </span>
              )}
              {cell.rotation && (
                <span className="storm-cell-badge storm-cell-badge-rotation">
                  <TornadoIcon size={13} /> Rotation
                </span>
              )}
              {cell.hailSizeIn != null && (
                <span className="storm-cell-badge storm-cell-badge-hail">
                  <HailIcon size={13} /> {cell.hailSizeIn}" hail
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>
      <p className="storm-cell-caption">
        From active NWS Tornado &amp; Severe Thunderstorm Warnings near you.
      </p>
    </section>
  );
}
