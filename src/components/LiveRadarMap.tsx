import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { fetchRadarFrames, radarTileUrl, type RadarFrame } from '../api/rainviewer';
import { PlayIcon, PauseIcon } from './icons';

const OKC_CENTER: [number, number] = [35.4676, -97.5164];

// Matches the OKC-metro towns shown in the mockup's radar screen — real
// coordinates so the labels land in their actual place on the basemap
// instead of needing hand-placed pixel positions.
const TOWN_LABELS: { name: string; lat: number; lon: number }[] = [
  { name: 'Kingfisher', lat: 35.8598, lon: -97.9328 },
  { name: 'Guthrie', lat: 35.8784, lon: -97.4256 },
  { name: 'Edmond', lat: 35.6529, lon: -97.4784 },
  { name: 'El Reno', lat: 35.5322, lon: -97.955 },
  { name: 'Oklahoma City', lat: 35.4676, lon: -97.5164 },
  { name: 'Norman', lat: 35.2226, lon: -97.4395 },
  { name: 'Chickasha', lat: 35.0526, lon: -97.9689 },
  { name: 'Purcell', lat: 35.014, lon: -97.3597 },
];

export default function LiveRadarMap() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const radarLayerRef = useRef<L.TileLayer | null>(null);
  const [frames, setFrames] = useState<RadarFrame[]>([]);
  const [host, setHost] = useState('');
  const [frameIndex, setFrameIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    fetchRadarFrames()
      .then(({ host: h, past }) => {
        if (past.length === 0) throw new Error('No radar frames');
        setHost(h);
        setFrames(past);
        setFrameIndex(past.length - 1);
      })
      .catch(() => setLoadError(true));
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    const map = L.map(mapContainerRef.current, {
      center: OKC_CENTER,
      zoom: 7,
      zoomControl: false,
      attributionControl: true,
    });
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    TOWN_LABELS.forEach(({ name, lat, lon }) => {
      L.marker([lat, lon], {
        icon: L.divIcon({ className: 'radar-town-label', html: name, iconSize: undefined }),
        interactive: false,
      }).addTo(map);
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const frame = frames[frameIndex];
    if (!map || !frame || !host) return;
    const url = radarTileUrl(host, frame);
    if (radarLayerRef.current) {
      radarLayerRef.current.setUrl(url);
    } else {
      radarLayerRef.current = L.tileLayer(url, { opacity: 0.75, pane: 'overlayPane' }).addTo(map);
    }
  }, [frames, frameIndex, host]);

  useEffect(() => {
    if (!playing || frames.length === 0) return;
    const interval = setInterval(() => {
      setFrameIndex((i) => (i + 1) % frames.length);
    }, 700);
    return () => clearInterval(interval);
  }, [playing, frames.length]);

  const currentFrame = frames[frameIndex];
  const isLatest = frames.length > 0 && frameIndex === frames.length - 1;
  const timeLabel = currentFrame
    ? new Date(currentFrame.time * 1000).toLocaleTimeString(undefined, {
        hour: 'numeric',
        minute: '2-digit',
      })
    : '';

  return (
    <section>
      <div className="radar-header">
        <h2>Live Radar</h2>
        <span className="radar-badge radar-badge-live">LIVE</span>
      </div>

      <div className="radar-map-wrap">
        <div ref={mapContainerRef} className="radar-map" />
        {loadError && (
          <div className="radar-load-error">Couldn't load live radar tiles right now.</div>
        )}
      </div>

      <div className="radar-controls">
        <button
          type="button"
          className="radar-play-button"
          onClick={() => setPlaying((p) => !p)}
          disabled={frames.length === 0}
          aria-label={playing ? 'Pause' : 'Play'}
        >
          {playing ? <PauseIcon size={16} /> : <PlayIcon size={16} />}
        </button>
        <span className="radar-time-label">
          {timeLabel || 'Loading…'}
          {isLatest && <span className="radar-now-badge">Now</span>}
        </span>
      </div>

      <div className="radar-legend">
        <span>Light</span>
        <span className="radar-legend-bar" />
        <span>Heavy</span>
      </div>

      <p className="radar-caption">
        Radar imagery from RainViewer, basemap from OpenStreetMap/CARTO — for the latest official
        radar loop, see{' '}
        <a href="https://radar.weather.gov/station/KTLX/standard" target="_blank" rel="noreferrer">
          radar.weather.gov
        </a>
        .
      </p>
    </section>
  );
}
