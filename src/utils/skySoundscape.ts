import type { WeatherCategory } from './weatherCategory';

// Procedurally generated ambient audio for the Sky View — synthesized
// entirely with the Web Audio API (filtered noise + oscillators), no
// audio files, no network call. Muted by default; only starts on an
// explicit user tap so it never autoplays unexpectedly.
export class SkySoundscape {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private started = false;

  private createNoiseBuffer(seconds: number): AudioBuffer {
    const ctx = this.ctx!;
    const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * seconds), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
    return buffer;
  }

  ensureStarted(category: WeatherCategory, windSpeed: number): void {
    if (this.started) return;
    const AudioCtor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtor) return;

    this.ctx = new AudioCtor();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.5;
    this.masterGain.connect(this.ctx.destination);

    if (category === 'rain' || category === 'storm') {
      const rain = this.ctx.createBufferSource();
      rain.buffer = this.createNoiseBuffer(2);
      rain.loop = true;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = category === 'storm' ? 2200 : 1800;
      filter.Q.value = 0.6;
      const gain = this.ctx.createGain();
      gain.gain.value = category === 'storm' ? 0.32 : 0.26;
      rain.connect(filter).connect(gain).connect(this.masterGain);
      rain.start();
    }

    if (windSpeed > 6 || category === 'storm') {
      const wind = this.ctx.createBufferSource();
      wind.buffer = this.createNoiseBuffer(2);
      wind.loop = true;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 500;
      const gain = this.ctx.createGain();
      gain.gain.value = Math.min(windSpeed / 60, 0.28);
      wind.connect(filter).connect(gain).connect(this.masterGain);
      wind.start();

      // Slow filter sweep so it gusts rather than hisses flatly.
      const lfo = this.ctx.createOscillator();
      lfo.frequency.value = 0.07;
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.value = 220;
      lfo.connect(lfoGain).connect(filter.frequency);
      lfo.start();
    }

    if (category === 'clear' || category === 'mostlyClear' || category === 'snow' || category === 'fog') {
      const drone = this.ctx.createOscillator();
      drone.type = 'sine';
      drone.frequency.value = 80;
      const gain = this.ctx.createGain();
      gain.gain.value = 0.03;
      drone.connect(gain).connect(this.masterGain);
      drone.start();
    }

    this.started = true;
  }

  // Fired at the same moment a lightning bolt is drawn — a low rumbling
  // burst arriving a beat after the flash, since sound travels slower
  // than light. A no-op if audio was never started (still muted).
  triggerThunder(): void {
    if (!this.ctx || !this.masterGain) return;
    const ctx = this.ctx;
    const noise = ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer(2.5);
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 220;
    const gain = ctx.createGain();
    const startAt = ctx.currentTime + 0.15 + Math.random() * 0.6;
    gain.gain.setValueAtTime(0, startAt);
    gain.gain.linearRampToValueAtTime(0.5, startAt + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, startAt + 2.2);
    noise.connect(filter).connect(gain).connect(this.masterGain);
    noise.start(startAt);
    noise.stop(startAt + 2.5);
  }

  setMuted(muted: boolean): void {
    if (this.masterGain) this.masterGain.gain.value = muted ? 0 : 0.5;
  }

  stop(): void {
    this.ctx?.close().catch(() => {});
    this.ctx = null;
    this.masterGain = null;
    this.started = false;
  }
}
