# Will's Severe Weather Alerts

A weather dashboard for tracking your local forecast, watching live storm radar, spotting
the next chance of severe weather, and sending customized alerts to friends.

## Features

- **Multiple locations** — search and save any number of cities, switch between them with a tap,
  and send alerts for whichever one is active.
- **Current conditions & 24-hour outlook** — temperature, feels-like, humidity, wind, gusts.
- **7-day forecast with severe weather risk** — each day gets a Low/Moderate/High/Severe
  risk score derived from forecasted weather codes (thunderstorms, hail), wind gusts, and
  precipitation probability. A banner surfaces the next day severe weather is expected.
- **Live storm radar** — animated precipitation radar (RainViewer) on a Leaflet map centered
  on your location.
- **Regional storm outlook** — NOAA Storm Prediction Center's Day 1–3 categorical convective
  outlook (Marginal/Slight/Enhanced/Moderate/High risk polygons), continental US.
- **Friends & alerts** — save friends' email/phone, compose a custom alert (pick the day,
  severity, and an optional personal note), preview the message, and send it. Alerts go out
  through your own email/SMS app (`mailto:` / `sms:` links) — no backend or credentials
  required, and friend data never leaves your browser (stored in `localStorage`).
  The tab is passcode-locked so only you can send alerts.
- **Alert history** — a log of everything you've sent.

## Getting started

```bash
npm install
npm run dev
```

Then open the printed local URL. Build for production with `npm run build`.

## Stack

Vite + React + TypeScript, weather data from [Open-Meteo](https://open-meteo.com/) (free,
keyless). No backend — all persistence is `localStorage`.
