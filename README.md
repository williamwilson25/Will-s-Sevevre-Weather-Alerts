# Will's Severe Weather Alerts

A weather dashboard for tracking your local forecast, watching live storm radar, spotting
the next chance of severe weather, and sending customized alerts to friends.

## Features

- **Accounts** — sign-in required to use the app (Firebase Authentication, email + password).
  Only the app owner's account sees the Alerts tab; everyone else gets the forecast, radar, and
  outlook views. Signing up also asks for a phone number and auto-detects the signer-upper's
  location (GPS, with a manual city-search fallback) and saves it to Firestore, so the owner's
  Alerts tab automatically picks up every new signup as a ready-to-alert friend — name, phone,
  and location already filled in. The owner can tap "View" on any friend with a location to
  switch the whole app to that place before sending them a storm alert.
- **Multiple locations** — search and save any number of cities, switch between them with a tap,
  and send alerts for whichever one is active.
- **Real-time updates** — forecast, radar, and outlook data all auto-refresh in the background
  (and whenever you return to the tab).
- **Minute-by-minute rain nowcast** — a bar-chart card (like Apple Weather's) showing whether
  rain is imminent, sourced from live radar: it samples the actual pixel under your coordinates
  across the most recent radar frame and RainViewer's short-term nowcast frames to say "Rain
  is expected to start in N min" with a ramping intensity chart. Falls back to a smoothed
  estimate from the hourly forecast if live radar sampling isn't available. Backed by an
  optional push notification (delivered through a service worker so it actually arrives on
  iOS home-screen installs) — every signed-in user gets a one-tap prompt on the Forecast tab to
  turn this on for their own location, no backend needed. A "Test alert" button next to the
  current-conditions card lets you confirm notifications work without waiting for real rain.
- **Current conditions** — a dedicated card with rain chance, feels-like, humidity, wind, gusts,
  UV index, pressure, visibility, dew point, sunrise, and sunset.
- **Active NWS alerts** — official Tornado Warnings, Severe Thunderstorm Warnings, Flash Flood
  Warnings, and more, pulled directly from the National Weather Service's own alerts feed for
  your exact location and shown the moment they're issued. Severity-colored, expandable for the
  full instructions (e.g. "TAKE COVER NOW"), and hidden entirely when nothing's active so it
  never adds clutter.
- **7-day forecast with severe weather risk** — each day gets a Low/Moderate/High/Severe
  risk score derived from forecasted weather codes (thunderstorms, hail), wind gusts, and
  precipitation probability. A banner surfaces the next day severe weather is expected. Tap
  a day to expand it for a tonight summary (low temp, wind speed/direction, gusts).
- **Live storm radar** — animated precipitation radar (RainViewer) on our own Leaflet map,
  centered on your location with play/scrub controls. Rendered as real map tiles rather than
  an embedded third-party page, so it isn't at the mercy of another site blocking embedding.
- **Regional storm outlook** — NOAA Storm Prediction Center's Day 1–3 categorical convective
  outlook (Marginal/Slight/Enhanced/Moderate/High risk polygons), continental US.
- **Alerts dashboard** — an overview card (alerts sent, sent this week, friend count, last alert
  sent), one-tap quick-alert presets for common warning types (Tornado Warning/Watch, Severe
  T-Storm Warning/Watch, Flash Flood Warning, High Wind Warning) that pre-fill the composer, and
  a sent-alert history with a status badge. Save friends' phone numbers, compose a custom alert
  (pick the day, severity, and an optional personal note), preview the message, and send it.
  Alerts go out through your own Messages app (`sms:` links), and friend data never leaves your
  browser (stored in `localStorage`). Only visible to the owner's account.
- **Discord alerts** — optionally paste a channel webhook URL to also post every alert straight
  to a Discord channel, with a one-tap test message to confirm it's wired up correctly.

## Getting started

```bash
npm install
npm run dev
```

Then open the printed local URL. Build for production with `npm run build`.

## Stack

Vite + React + TypeScript, weather data from [Open-Meteo](https://open-meteo.com/) (free,
keyless), sourced from NOAA's GFS/HRRR model blend for better short-term US severe-weather
accuracy than Open-Meteo's default multi-country blend. Firebase Authentication handles
sign-in, and Cloud Firestore stores one small
`subscribers/{uid}` record per signed-up user (email, phone, location) so the owner can see
who's signed up — see `firestore.rules` for the exact access rules (each user can only write
their own record; only the owner can read everyone's). Everything else (friends list, alert
history, saved locations, Discord webhook) stays in `localStorage` on the owner's device.
