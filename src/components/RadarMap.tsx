import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Location } from '../types';
import { fetchRadarData, radarTileUrl, type RadarFrame } from '../api/radar';

interface Props {
  location: Location;
}

interface TimelineFrame extends RadarFrame {
  isForecast: boolean;
}

const FRAME_INTERVAL_MS = 600;

export default function RadarMap({ location }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const radarLayerRef = useRef<L.TileLayer | null>(null);
  const markerRef = useRef<L.CircleMarker | null>(null);
  const hostRef = useRef<string>('');
  const playingRef = useRef(false);

  const [frames, setFrames] = useState<TimelineFrame[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);

  // Init map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center: [location.latitude, location.longitude],
      zoom: 7,
      maxZoom: 19,
      zoomControl: true,
      attributionControl: true,
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);
    markerRef.current = L.circleMarker([location.latitude, location.longitude], {
      radius: 7,
      color: '#fff',
      weight: 2,
      fillColor: '#38bdf8',
      fillOpacity: 1,
    })
      .addTo(map)
      .bindTooltip(locationLabel(location), {
        permanent: true,
        direction: 'top',
        offset: [0, -8],
        className: 'radar-location-label',
      });
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recenter when location changes
  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.setView([location.latitude, location.longitude], mapRef.current.getZoom());
    markerRef.current?.setLatLng([location.latitude, location.longitude]);
    markerRef.current?.setTooltipContent(locationLabel(location));
  }, [location]);

  // Load radar frame list, then keep it fresh in the background
  useEffect(() => {
    let cancelled = false;

    function load(initial: boolean) {
      if (initial) setLoading(true);
      setError('');
      fetchRadarData()
        .then((data) => {
          if (cancelled) return;
          hostRef.current = data.host;
          const combined: TimelineFrame[] = [
            ...data.past.map((f) => ({ ...f, isForecast: false })),
            ...data.nowcast.map((f) => ({ ...f, isForecast: true })),
          ];
          setFrames(combined);
          if (initial || !playingRef.current) {
            setActiveIndex(Math.max(0, data.past.length - 1));
          }
        })
        .catch((err) => {
          if (!cancelled && initial) {
            setError(err instanceof Error ? err.message : 'Failed to load radar');
          }
        })
        .finally(() => {
          if (!cancelled && initial) setLoading(false);
        });
    }

    load(true);
    const interval = setInterval(() => load(false), 5 * 60 * 1000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  // Update radar tile layer when active frame changes
  useEffect(() => {
    if (!mapRef.current || frames.length === 0) return;
    const frame = frames[activeIndex];
    if (!frame) return;
    const url = radarTileUrl(hostRef.current, frame);
    if (radarLayerRef.current) {
      radarLayerRef.current.setUrl(url);
    } else {
      radarLayerRef.current = L.tileLayer(url, {
        opacity: 0.65,
        zIndex: 10,
        maxZoom: 19,
        maxNativeZoom: 12,
      }).addTo(mapRef.current);
    }
  }, [frames, activeIndex]);

  // Playback loop
  useEffect(() => {
    if (!playing || frames.length === 0) return;
    const id = setInterval(() => {
      setActiveIndex((i) => (i + 1) % frames.length);
    }, FRAME_INTERVAL_MS);
    return () => clearInterval(id);
  }, [playing, frames.length]);

  const activeFrame = frames[activeIndex];
  const isLive = activeFrame && !activeFrame.isForecast && activeIndex === lastPastIndex(frames);

  return (
    <section className="radar-section">
      <div className="radar-header">
        <h2>Live storm radar</h2>
        {activeFrame && (
          <span className={`radar-badge ${isLive ? 'radar-badge-live' : 'radar-badge-forecast'}`}>
            {isLive ? 'LIVE' : activeFrame.isForecast ? 'FORECAST' : ''}
            {' '}
            {formatFrameTime(activeFrame.time)}
          </span>
        )}
      </div>

      {error && <p className="form-error">Couldn't load radar: {error}</p>}
      {loading && <p className="empty-state">Loading radar…</p>}

      <div className="radar-map-wrap">
        <div ref={containerRef} className="radar-map" />
      </div>

      {frames.length > 1 && (
        <div className="radar-controls">
          <button
            type="button"
            className="radar-play-button"
            onClick={() => setPlaying((p) => !p)}
            aria-label={playing ? 'Pause' : 'Play'}
          >
            {playing ? '⏸' : '▶'}
          </button>
          <input
            type="range"
            min={0}
            max={frames.length - 1}
            value={activeIndex}
            onChange={(e) => {
              setPlaying(false);
              setActiveIndex(Number(e.target.value));
            }}
            className="radar-scrubber"
          />
        </div>
      )}
      <p className="radar-caption">Radar data from RainViewer, updated every ~10 minutes.</p>
    </section>
  );
}

function locationLabel(location: Location): string {
  return location.admin1 ? `${location.name}, ${location.admin1}` : location.name;
}

function lastPastIndex(frames: TimelineFrame[]): number {
  let idx = -1;
  frames.forEach((f, i) => {
    if (!f.isForecast) idx = i;
  });
  return idx;
}

function formatFrameTime(unixSeconds: number): string {
  return new Date(unixSeconds * 1000).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}
