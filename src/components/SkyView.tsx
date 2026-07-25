import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { categorizeWeather } from '../utils/weatherCategory';
import { CloseIcon } from './icons';

interface Props {
  weatherCode: number;
  isDay: boolean;
  windSpeed: number;
  windDirection: number;
  temperature: number;
  label: string;
  locationName: string;
  onClose: () => void;
}

interface Star {
  x: number;
  y: number;
  r: number;
  phase: number;
  speed: number;
}

interface Cloud {
  x: number;
  y: number;
  scale: number;
  speed: number;
  opacity: number;
}

interface Raindrop {
  x: number;
  y: number;
  len: number;
  speed: number;
}

interface Snowflake {
  x: number;
  y: number;
  r: number;
  speed: number;
  sway: number;
}

// A full-screen, weather-code-driven animated scene — not a forecast
// screen, just an ambient "what it actually looks like out there right
// now" view. Built entirely from data the app already has (weatherCode,
// isDay, wind), no new API or asset dependency. Respects
// prefers-reduced-motion by rendering one static frame instead of
// animating.
export default function SkyView({
  weatherCode,
  isDay,
  windSpeed,
  windDirection,
  temperature,
  label,
  locationName,
  onClose,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const category = categorizeWeather(weatherCode);
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let width = window.innerWidth;
    let height = window.innerHeight;

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    // windDirection is the compass direction wind is blowing FROM (met.
    // convention, matches the storm-cell math elsewhere in this app) —
    // flip 180 for the direction it's actually blowing toward, purely to
    // lean the rain streaks visually.
    const towardRad = (((windDirection + 180) % 360) * Math.PI) / 180;
    const windLean = Math.sin(towardRad) * Math.min(windSpeed / 40, 1);

    const showStars = !isDay && ['clear', 'mostlyClear', 'cloudy'].includes(category);
    const stars: Star[] = showStars
      ? Array.from({ length: 140 }, () => ({
          x: Math.random(),
          y: Math.random() * 0.65,
          r: Math.random() * 1.3 + 0.3,
          phase: Math.random() * Math.PI * 2,
          speed: Math.random() * 0.002 + 0.001,
        }))
      : [];

    const showClouds = ['cloudy', 'overcast', 'rain', 'snow', 'storm', 'fog'].includes(category);
    const cloudCount = category === 'overcast' || category === 'storm' ? 7 : category === 'cloudy' ? 4 : 3;
    const clouds: Cloud[] = showClouds
      ? Array.from({ length: cloudCount }, (_, i) => ({
          x: Math.random() * 1.3 - 0.15,
          y: 0.08 + Math.random() * 0.35,
          scale: 0.6 + Math.random() * 1.1,
          speed: (0.15 + Math.random() * 0.25) * (0.4 + i * 0.15),
          opacity: 0.35 + Math.random() * 0.35,
        }))
      : [];

    const rainCount = category === 'storm' ? 240 : category === 'rain' ? 150 : 0;
    const raindrops: Raindrop[] = Array.from({ length: rainCount }, () => ({
      x: Math.random(),
      y: Math.random(),
      len: 14 + Math.random() * 18,
      speed: 6 + Math.random() * 5,
    }));

    const snowCount = category === 'snow' ? 120 : 0;
    const snowflakes: Snowflake[] = Array.from({ length: snowCount }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: 1.5 + Math.random() * 2.5,
      speed: 0.4 + Math.random() * 0.6,
      sway: Math.random() * Math.PI * 2,
    }));

    const fogBands =
      category === 'fog'
        ? Array.from({ length: 5 }, (_, i) => ({ y: 0.3 + i * 0.13, speed: 0.4 + i * 0.15, opacity: 0.12 + i * 0.03 }))
        : [];

    let nextLightning = category === 'storm' ? performance.now() + 1500 + Math.random() * 3000 : Infinity;
    let flashUntil = 0;

    function skyGradient(): CanvasGradient {
      const g = ctx!.createLinearGradient(0, 0, 0, height);
      if (category === 'storm') {
        g.addColorStop(0, isDay ? '#2b2f3d' : '#0a0b12');
        g.addColorStop(1, isDay ? '#4a4f5e' : '#161822');
      } else if (category === 'overcast') {
        g.addColorStop(0, isDay ? '#4b5563' : '#12141c');
        g.addColorStop(1, isDay ? '#6b7280' : '#20222c');
      } else if (category === 'rain') {
        g.addColorStop(0, isDay ? '#3d4a5c' : '#0d1420');
        g.addColorStop(1, isDay ? '#5b6b80' : '#1b2636');
      } else if (category === 'snow') {
        g.addColorStop(0, isDay ? '#5b6478' : '#151a26');
        g.addColorStop(1, isDay ? '#8892a3' : '#293246');
      } else if (category === 'fog') {
        g.addColorStop(0, isDay ? '#7d8590' : '#1b1e26');
        g.addColorStop(1, isDay ? '#a6acb5' : '#33363f');
      } else {
        g.addColorStop(0, isDay ? '#2b6cb0' : '#050714');
        g.addColorStop(0.6, isDay ? '#63a4d8' : '#0c1230');
        g.addColorStop(1, isDay ? '#a9d4ec' : '#1a1440');
      }
      return g;
    }

    function drawSunMoon() {
      const cx = width * 0.76;
      const cy = height * 0.22;
      const r = 46;
      ctx!.save();
      if (isDay) {
        const glow = ctx!.createRadialGradient(cx, cy, 0, cx, cy, r * 4);
        glow.addColorStop(0, 'rgba(255, 214, 130, 0.55)');
        glow.addColorStop(1, 'rgba(255, 214, 130, 0)');
        ctx!.fillStyle = glow;
        ctx!.fillRect(cx - r * 4, cy - r * 4, r * 8, r * 8);
        ctx!.fillStyle = '#fff2cf';
        ctx!.beginPath();
        ctx!.arc(cx, cy, r, 0, Math.PI * 2);
        ctx!.fill();
      } else {
        const glow = ctx!.createRadialGradient(cx, cy, 0, cx, cy, r * 3);
        glow.addColorStop(0, 'rgba(220, 225, 255, 0.35)');
        glow.addColorStop(1, 'rgba(220, 225, 255, 0)');
        ctx!.fillStyle = glow;
        ctx!.fillRect(cx - r * 3, cy - r * 3, r * 6, r * 6);
        ctx!.fillStyle = '#eef0fb';
        ctx!.beginPath();
        ctx!.arc(cx, cy, r * 0.75, 0, Math.PI * 2);
        ctx!.fill();
        ctx!.fillStyle = 'rgba(10, 12, 30, 0.9)';
        ctx!.beginPath();
        ctx!.arc(cx + r * 0.3, cy - r * 0.15, r * 0.68, 0, Math.PI * 2);
        ctx!.fill();
      }
      ctx!.restore();
    }

    function drawCloud(x: number, y: number, scale: number, opacity: number) {
      ctx!.save();
      ctx!.globalAlpha = opacity;
      ctx!.fillStyle = category === 'storm' ? '#12141c' : isDay ? '#f4f6fb' : '#2a2e3d';
      const puffs: [number, number, number][] = [
        [0, 0, 30],
        [26, -8, 24],
        [-26, -6, 22],
        [12, 8, 26],
        [-14, 10, 22],
      ];
      for (const [dx, dy, r] of puffs) {
        ctx!.beginPath();
        ctx!.arc(x + dx * scale, y + dy * scale, r * scale, 0, Math.PI * 2);
        ctx!.fill();
      }
      ctx!.restore();
    }

    function drawLightningBolt() {
      ctx!.save();
      ctx!.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx!.lineWidth = 3;
      ctx!.shadowColor = '#cbe0ff';
      ctx!.shadowBlur = 18;
      let x = width * (0.2 + Math.random() * 0.6);
      let y = 0;
      ctx!.beginPath();
      ctx!.moveTo(x, y);
      while (y < height * 0.6) {
        x += (Math.random() - 0.5) * 60;
        y += 30 + Math.random() * 30;
        ctx!.lineTo(x, y);
      }
      ctx!.stroke();
      ctx!.restore();
    }

    let raf = 0;

    function frame(t: number) {
      ctx!.clearRect(0, 0, width, height);
      ctx!.fillStyle = skyGradient();
      ctx!.fillRect(0, 0, width, height);

      if (category === 'storm' && t > flashUntil && t > nextLightning) {
        flashUntil = t + 140;
        nextLightning = t + 2500 + Math.random() * 5000;
        drawLightningBolt();
      }
      if (t < flashUntil) {
        ctx!.save();
        ctx!.globalAlpha = 0.28;
        ctx!.fillStyle = '#eaf1ff';
        ctx!.fillRect(0, 0, width, height);
        ctx!.restore();
      }

      drawSunMoon();

      for (const s of stars) {
        const twinkle = 0.5 + 0.5 * Math.sin(t * s.speed + s.phase);
        ctx!.save();
        ctx!.globalAlpha = 0.3 + twinkle * 0.7;
        ctx!.fillStyle = '#fff';
        ctx!.beginPath();
        ctx!.arc(s.x * width, s.y * height, s.r, 0, Math.PI * 2);
        ctx!.fill();
        ctx!.restore();
      }

      for (const c of clouds) {
        if (!reducedMotion) {
          c.x += c.speed * 0.00006 * (1 + windSpeed / 30);
          if (c.x > 1.15) c.x = -0.15;
        }
        drawCloud(c.x * width, c.y * height, c.scale, c.opacity);
      }

      if (category === 'fog') {
        for (const band of fogBands) {
          ctx!.save();
          ctx!.globalAlpha = band.opacity;
          ctx!.fillStyle = '#e5e7eb';
          const offset = reducedMotion ? 0 : (t * band.speed * 0.02) % width;
          ctx!.fillRect(-width + offset, band.y * height, width * 2, 60);
          ctx!.restore();
        }
      }

      if (raindrops.length > 0) {
        ctx!.save();
        ctx!.strokeStyle = isDay ? 'rgba(180,200,230,0.55)' : 'rgba(180,200,255,0.4)';
        ctx!.lineWidth = 1.4;
        for (const d of raindrops) {
          if (!reducedMotion) {
            d.y += d.speed * 0.01;
            if (d.y > 1) {
              d.y = -0.05;
              d.x = Math.random();
            }
          }
          const x = d.x * width;
          const y = d.y * height;
          ctx!.beginPath();
          ctx!.moveTo(x, y);
          ctx!.lineTo(x + windLean * 12, y + d.len);
          ctx!.stroke();
        }
        ctx!.restore();
      }

      if (snowflakes.length > 0) {
        ctx!.save();
        ctx!.fillStyle = '#ffffff';
        for (const f of snowflakes) {
          if (!reducedMotion) {
            f.y += f.speed * 0.006;
            f.sway += 0.02;
            if (f.y > 1) f.y = -0.05;
          }
          const x = (f.x + Math.sin(f.sway) * 0.01) * width;
          const y = f.y * height;
          ctx!.globalAlpha = 0.85;
          ctx!.beginPath();
          ctx!.arc(x, y, f.r, 0, Math.PI * 2);
          ctx!.fill();
        }
        ctx!.restore();
      }

      if (!reducedMotion) raf = requestAnimationFrame(frame);
    }

    raf = requestAnimationFrame(frame);
    if (reducedMotion) frame(0);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [weatherCode, isDay, windSpeed, windDirection]);

  return createPortal(
    <div className="sky-view" role="dialog" aria-modal="true" aria-label="Live sky view" onClick={onClose}>
      <canvas ref={canvasRef} className="sky-view-canvas" />
      <button type="button" className="sky-view-close" onClick={onClose} aria-label="Close sky view">
        <CloseIcon size={20} />
      </button>
      <div className="sky-view-info" onClick={(e) => e.stopPropagation()}>
        <span className="sky-view-tag">Live Sky View</span>
        <div className="sky-view-temp">{Math.round(temperature)}°</div>
        <div className="sky-view-label">{label}</div>
        <div className="sky-view-location">{locationName}</div>
      </div>
    </div>,
    document.body,
  );
}
