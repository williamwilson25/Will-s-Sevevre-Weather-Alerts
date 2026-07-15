# StormWatch

A weather dashboard for tracking your local forecast, spotting the next chance of
severe weather, and sending customized alerts to friends.

## Features

- **Location search** — find any city via Open-Meteo's geocoding API (no API key needed).
- **Current conditions & 24-hour outlook** — temperature, feels-like, humidity, wind, gusts.
- **7-day forecast with severe weather risk** — each day gets a Low/Moderate/High/Severe
  risk score derived from forecasted weather codes (thunderstorms, hail), wind gusts, and
  precipitation probability. A banner surfaces the next day severe weather is expected.
- **Friends & alerts** — save friends' email/phone, compose a custom alert (pick the day,
  severity, and an optional personal note), preview the message, and send it. Alerts go out
  through your own email/SMS app (`mailto:` / `sms:` links) — no backend or credentials
  required, and friend data never leaves your browser (stored in `localStorage`).
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
