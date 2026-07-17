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
  pressure, visibility, dew point, sunrise, and sunset, sourced from the nearest live NWS
  observation station (not a forecast estimate — an actual reading, updated as often as the
  station reports). No UV index: NWS doesn't publish one, so rather than show a fake number the
  app just leaves it out.
- **Will's Official Forecast** — the app's primary multi-day forecast, sourced directly from
  the National Weather Service office responsible for your location (Norman, OK for this app's
  Great Plains focus) via NWS's own point-forecast API — the same human-written day/night
  forecast periods, icons, temperatures, and full forecast discussion text NWS itself
  publishes, expandable per period and labeled with the issuing office.
- **Active NWS alerts** — official Tornado Warnings, Severe Thunderstorm Warnings, Flash Flood
  Warnings, and more, pulled directly from the National Weather Service's own alerts feed for
  your exact location and shown the moment they're issued. Severity-colored, expandable for the
  full instructions (e.g. "TAKE COVER NOW"), and hidden entirely when nothing's active so it
  never adds clutter.
- **Severe weather risk scoring** — each day also gets a Low/Moderate/High/Severe risk score
  derived from forecasted weather codes (thunderstorms, hail), wind gusts, and precipitation
  probability, surfaced as a banner for the next day severe weather is expected and used to
  pick which day the one-tap "Alert friends" action targets.
- **Live storm radar** — the National Weather Service's own radar loop for the Norman, OK
  station (KTLX, radar.weather.gov), embedded directly, with a link to open it full-screen if
  it doesn't load.
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

## Navigation

Forecast, Radar, Outlook, and Alerts are real swipeable pages, not one long scrolling
document — a compact status bar (icon, temperature, location) and the tab bar stay pinned at
the top, and each tab's content scrolls independently underneath. Swipe left/right anywhere
on a tab to page to the next/previous one, in addition to tapping the tab bar. Swipes starting
on the hourly-forecast scroll strip, the radar/outlook maps, or the radar scrubber are ignored
so they don't fight with those elements' own gestures.

## Getting started

```bash
npm install
npm run dev
```

Then open the printed local URL. Build for production with `npm run build`.

## Stack

Vite + React + TypeScript. All weather data — current conditions, hourly and multi-day forecast,
severe weather risk scoring, active alerts, and the primary forecast text — comes from the
National Weather Service's public API (api.weather.gov), free and keyless: current conditions
from the nearest live observation station, forecasts from the NWS office responsible for each
location (Norman/OUN for this app's Great Plains focus). Live radar is an embed of NWS's own
radar.weather.gov loop for the Norman station (KTLX). The only non-NWS call is Open-Meteo's free
geocoding search, used purely to
turn a typed city name into coordinates — no weather data comes from it. Sunrise/sunset are
computed locally (NWS doesn't publish them) via the standard solar-position algorithm, accurate
to within about a quarter hour. Firebase Authentication handles sign-in, and Cloud Firestore
stores one small `subscribers/{uid}` record per signed-up user (email, phone, location) so the
owner can see who's signed up — see `firestore.rules` for the exact access rules (each user can
only write their own record; only the owner can read everyone's). Everything else (friends list,
alert history, saved locations, Discord webhook) stays in `localStorage` on the owner's device.
