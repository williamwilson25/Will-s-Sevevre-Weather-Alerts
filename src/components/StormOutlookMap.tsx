import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { DailyForecast, Location } from '../types';
import { fetchConvectiveOutlook, legendFor, type SpcFeature } from '../api/spcOutlook';

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
  const layerRef = useRef<L.GeoJSON | null>(null);

  const [day, setDay] = useState<1 | 2 | 3>(1);
  const [features, setFeatures] = useState<SpcFeature[]>([]);
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
      attribution: '&copy; OpenStreetMap contributors, outlook &copy; NOAA/SPC',
      maxZoom: 18,
    }).addTo(map);
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

  // Fetch the SPC outlook for the selected day
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    fetchConvectiveOutlook(day)
      .then((data) => {
        if (!cancelled) setFeatures(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load outlook');
          setFeatures([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [day]);

  // Render polygons
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    layerRef.current?.remove();

    if (features.length === 0) return;

    const layer = L.geoJSON(
      features.map((f) => ({
        type: 'Feature',
        properties: f.properties,
        geometry: f.geometry,
      })) as GeoJSON.Feature[],
      {
        style: (feature) => ({
          fillColor: feature?.properties.fill,
          fillOpacity: 0.55,
          color: feature?.properties.stroke,
          weight: 1.5,
        }),
        onEachFeature: (feature, layerItem) => {
          layerItem.bindTooltip(feature.properties.labelFull, { sticky: true });
        },
      },
    ).addTo(map);
    layerRef.current = layer;
  }, [features]);

  const legend = legendFor(features);

  return (
    <section className="outlook-section">
      <div className="outlook-header">
        <div>
          <h2>Chance of rain &amp; storms</h2>
          <p className="outlook-subtitle">
            {daily[day - 1] ? dayLabel(daily[day - 1].date, day - 1) : `Day ${day}`}
          </p>
        </div>
        <select
          className="outlook-day-select"
          value={day}
          onChange={(e) => setDay(Number(e.target.value) as 1 | 2 | 3)}
        >
          {[0, 1, 2].map((i) => (
            <option key={i} value={i + 1}>
              {daily[i] ? dayLabel(daily[i].date, i) : `Day ${i + 1}`}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="form-error">Couldn't load outlook: {error}</p>}
      {loading && <p className="empty-state">Loading NOAA outlook…</p>}
      {!loading && !error && features.length === 0 && (
        <p className="empty-state">No severe weather risk areas outlooked for this day.</p>
      )}

      <div className="radar-map-wrap outlook-map-wrap">
        <div ref={containerRef} className="radar-map" />
        {legend.length > 0 && (
          <div className="outlook-legend">
            <div className="outlook-legend-title">Risk</div>
            {legend.map((item) => (
              <div className="outlook-legend-row" key={item.label}>
                <span className="outlook-legend-swatch" style={{ background: item.fill }} />
                {item.labelFull.toUpperCase()}
              </div>
            ))}
          </div>
        )}
      </div>
      <p className="radar-caption">
        Categorical convective outlook from NOAA's Storm Prediction Center (continental US, Day
        1–3).
      </p>
    </section>
  );
}
