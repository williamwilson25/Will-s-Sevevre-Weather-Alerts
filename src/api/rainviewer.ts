const RAINVIEWER_URL = 'https://api.rainviewer.com/public/weather-maps.json';

export interface RadarFrame {
  time: number;
  path: string;
}

export interface RadarFrameSet {
  host: string;
  past: RadarFrame[];
  nowcast: RadarFrame[];
}

export async function fetchRadarFrames(): Promise<RadarFrameSet> {
  const res = await fetch(RAINVIEWER_URL);
  if (!res.ok) throw new Error(`RainViewer fetch failed (${res.status})`);
  const data = await res.json();
  return {
    host: data.host,
    past: data.radar?.past ?? [],
    nowcast: data.radar?.nowcast ?? [],
  };
}

// size=256, color scheme 2 (universal blue-to-red), smooth=1, snow layer on.
export function radarTileUrl(host: string, frame: RadarFrame): string {
  return `${host}${frame.path}/256/{z}/{x}/{y}/2/1_1.png`;
}
