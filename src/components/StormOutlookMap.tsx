import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { DailyForecast, Location } from '../types';
import { fetchStormOutlook, TIER_COLOR, TIER_LABEL, type OutlookPoint } from '../api/outlook';
import { nearbyCities } from '../utils/geo';

interface Props {
  location: Location;
  daily: DailyForecast[];
}

function dayLabel(date: string, index: number): string {
  if (index === 0) return 'Today';
  if (index === 1) return 'Tomorrow';
  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

export default function StormOutlookMap({ location, daily }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  const [dayIndex, setDayIndex] = useState(Math.min(1, daily.length - 1));
  const [points, setPoints] = useState<OutlookPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Init map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center: [location.latitude, location.longitude],
      zoom: 6,
      zoomControl: true,
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(map);
    layerGroupRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recenter when location changes
  useEffect(() => {
    mapRef.current?.setView([location.latitude, location.longitude], 6);
  }, [location]);

  // Fetch outlook for the selected day
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    const cities = nearbyCities(location.latitude, location.longitude, 14);
    fetchStormOutlook(cities, dayIndex)
      .then((data) => {
        if (!cancelled) setPoints(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load outlook');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [location, dayIndex]);

  // Render markers
  useEffect(() => {
    const map = mapRef.current;
    const group = layerGroupRef.current;
    if (!map || !group) return;
    group.clearLayers();

    points.forEach((point) => {
      const color = TIER_COLOR[point.tier];
      L.circle([point.lat, point.lon], {
        radius: 45000,
        color: 'transparent',
        fillColor: color,
        fillOpacity: 0.32,
        weight: 0,
      }).addTo(group);

      const icon = L.divIcon({
        className: 'outlook-label-wrap',
        html: `<div class="outlook-label outlook-label-${point.tier}"><strong>${Math.round(
          point.probability,
        )}%</strong><span>${point.name}</span></div>`,
        iconSize: undefined,
        iconAnchor: [30, 15],
      });
      L.marker([point.lat, point.lon], { icon }).addTo(group);
    });
  }, [points]);

  return (
    <section className="outlook-section">
      <div className="outlook-header">
        <div>
          <h2>Chance of rain &amp; storms</h2>
          <p className="outlook-subtitle">{daily[dayIndex] ? dayLabel(daily[dayIndex].date, dayIndex) : ''}</p>
        </div>
        <select
          className="outlook-day-select"
          value={dayIndex}
          onChange={(e) => setDayIndex(Number(e.target.value))}
        >
          {daily.map((d, i) => (
            <option key={d.date} value={i}>
              {dayLabel(d.date, i)}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="form-error">Couldn't load outlook: {error}</p>}
      {loading && <p className="empty-state">Loading regional outlook…</p>}

      <div className="radar-map-wrap outlook-map-wrap">
        <div ref={containerRef} className="radar-map" />
        <div className="outlook-legend">
          <div className="outlook-legend-title">Legend</div>
          {(['likely', 'moderate', 'slight'] as const).map((tier) => (
            <div className="outlook-legend-row" key={tier}>
              <span className="outlook-legend-swatch" style={{ background: TIER_COLOR[tier] }} />
              {TIER_LABEL[tier].toUpperCase()}
            </div>
          ))}
        </div>
      </div>
      <p className="radar-caption">
        Percent chance of rain or storms for nearby cities, from Open-Meteo.
      </p>
    </section>
  );
}
