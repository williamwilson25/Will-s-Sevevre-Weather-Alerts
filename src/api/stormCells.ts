export interface StormCell {
  id: string;
  distanceMi: number | null;
  bearing: string | null;
  speedMph: number | null;
  etaMinutes: number | null;
  hailSizeIn: number | null;
  rotation: boolean;
}

const CELL_EVENTS = ['Tornado Warning', 'Severe Thunderstorm Warning'];
const MAX_DISTANCE_MI = 100;
const EARTH_RADIUS_MI = 3958.8;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function haversineMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return EARTH_RADIUS_MI * 2 * Math.asin(Math.sqrt(a));
}

function bearingFromTo(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const y = Math.sin(toRad(lon2 - lon1)) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(toRad(lon2 - lon1));
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

function compass(deg: number): string {
  const points = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return points[Math.round(((deg % 360) + 360) % 360 / 45) % 8];
}

function angleDiff(a: number, b: number): number {
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
}

// The NWS's "eventMotionDescription" CAP parameter, present on active
// Tornado/Severe Thunderstorm Warnings, e.g.
// "2026-07-21T20:15:00-05:00...tornado...229DEG...35KT...30.50,-97.70" — the
// dirDEG is the direction the storm is moving FROM (standard meteorological
// convention), not toward, so its direction of travel is dirDEG + 180.
function parseMotion(raw: string): { lat: number; lon: number; fromDeg: number; speedKt: number } | null {
  const parts = raw.split('...');
  if (parts.length < 4) return null;
  const fromDeg = Number(parts[2].replace(/DEG$/i, ''));
  const speedKt = Number(parts[3].replace(/KT$/i, ''));
  const firstPoint = parts[4]?.trim().split(' ')[0];
  if (!firstPoint) return null;
  const [lat, lon] = firstPoint.split(',').map(Number);
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || !Number.isFinite(fromDeg) || !Number.isFinite(speedKt)) {
    return null;
  }
  return { lat, lon, fromDeg, speedKt };
}

function polygonCentroid(geometry: { type: string; coordinates: unknown } | null): { lat: number; lon: number } | null {
  if (!geometry || geometry.type !== 'Polygon') return null;
  const rings = geometry.coordinates as number[][][];
  const ring = rings?.[0];
  if (!ring || ring.length === 0) return null;
  const sum = ring.reduce((acc, [lon, lat]) => ({ lat: acc.lat + lat, lon: acc.lon + lon }), { lat: 0, lon: 0 });
  return { lat: sum.lat / ring.length, lon: sum.lon / ring.length };
}

// Nearby storm cells, derived straight from NWS's own active severe
// warnings — no third-party vendor, no API key, same free keyless
// api.weather.gov endpoint the rest of the app already calls. Each active
// Tornado/Severe Thunderstorm Warning already represents a radar-detected
// cell (that's why the warning was issued), and the CAP parameters below
// carry its motion, hail size, and rotation status directly from the NWS
// forecaster who issued it.
export async function fetchNearbyStormCells(latitude: number, longitude: number): Promise<StormCell[]> {
  const url = new URL('https://api.weather.gov/alerts/active');
  url.searchParams.set('event', CELL_EVENTS.join(','));
  url.searchParams.set('status', 'actual');
  url.searchParams.set('message_type', 'alert,update');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url.toString(), {
      headers: { Accept: 'application/geo+json' },
      signal: controller.signal,
    });
    if (!res.ok) return [];
    const data = await res.json();
    const features: unknown[] = data.features ?? [];

    return features
      .map((f) => {
        const feature = f as { id?: string; geometry?: { type: string; coordinates: unknown }; properties?: Record<string, unknown> };
        const p = feature.properties ?? {};
        const params = (p.parameters as Record<string, unknown[]>) ?? {};
        const motionRaw = (params.eventMotionDescription?.[0] as string) ?? null;
        const motion = motionRaw ? parseMotion(motionRaw) : null;
        const position = motion ?? polygonCentroid(feature.geometry ?? null);
        if (!position) return null;

        const distanceMi = haversineMiles(latitude, longitude, position.lat, position.lon);
        if (distanceMi > MAX_DISTANCE_MI) return null;

        const bearingToStorm = bearingFromTo(latitude, longitude, position.lat, position.lon);
        const speedMph = motion ? Math.round(motion.speedKt * 1.15078) : null;

        let etaMinutes: number | null = null;
        if (motion && speedMph && speedMph > 2) {
          const travelBearing = (motion.fromDeg + 180) % 360;
          const bearingToViewer = bearingFromTo(position.lat, position.lon, latitude, longitude);
          // Only claim an ETA if the storm's actual heading is roughly
          // pointed at the viewer — otherwise a beeline ETA would be
          // misleading for a cell that's merely passing nearby.
          if (angleDiff(travelBearing, bearingToViewer) <= 40) {
            etaMinutes = Math.round((distanceMi / speedMph) * 60);
          }
        }

        const hailRaw = params.maxHailSize?.[0] as string | undefined;
        const hailSizeIn = hailRaw ? Number(hailRaw) : null;
        const tornadoDetection = params.tornadoDetection?.[0] as string | undefined;
        const rotation = p.event === 'Tornado Warning' || Boolean(tornadoDetection);

        const cell: StormCell = {
          id: String(feature.id ?? p.id ?? `${position.lat},${position.lon}`),
          distanceMi: Math.round(distanceMi),
          bearing: compass(bearingToStorm),
          speedMph,
          etaMinutes,
          hailSizeIn: Number.isFinite(hailSizeIn) ? hailSizeIn : null,
          rotation,
        };
        return cell;
      })
      .filter((cell): cell is StormCell => cell !== null)
      .sort((a, b) => (a.distanceMi ?? Infinity) - (b.distanceMi ?? Infinity))
      .slice(0, 8);
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}
