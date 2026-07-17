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
  (and whenever you return to the tab), plus a "Rain expected to start soon" banner that fires
  the moment the hourly data shows a jump in rain chance, with an optional push notification
  (delivered through a service worker so it actually arrives on iOS home-screen installs). A
  "Test alert" button next to the current-conditions card lets you confirm notifications work
  without waiting for real rain.
- **Current conditions** — a dedicated card with rain chance, feels-like, humidity, wind, gusts,
  UV index, pressure, visibility, dew point, sunrise, and sunset.
- **7-day forecast with severe weather risk** — each day gets a Low/Moderate/High/Severe
  risk score derived from forecasted weather codes (thunderstorms, hail), wind gusts, and
  precipitation probability. A banner surfaces the next day severe weather is expected. Tap
  a day to expand it for a tonight summary (low temp, wind speed/direction, gusts).
- **Live storm radar** — News 9's live radar, embedded right in the app.
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
keyless). Firebase Authentication handles sign-in, and Cloud Firestore stores one small
`subscribers/{uid}` record per signed-up user (email, phone, location) so the owner can see
who's signed up — see `firestore.rules` for the exact access rules (each user can only write
their own record; only the owner can read everyone's). Everything else (friends list, alert
history, saved locations, Discord webhook) stays in `localStorage` on the owner's device.
