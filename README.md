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
- **Short-term rain nowcast** — a bar-chart card (like Apple Weather's) showing whether rain is
  imminent, built entirely from the National Weather Service's own hourly forecast rain chance
  to say "Rain is expected to start in N min" with a ramping intensity chart. Backed by an
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
- **Per-warning-type notifications** — pick exactly which official alert types (Tornado
  Warnings/Watches, Severe T-Storm Warnings/Watches, Flash Flood Warnings, High Wind Warnings,
  Winter Weather Alerts) push a notification. Checked across every saved location, not just the
  one on screen — add more cities from the search bar to get warned about severe weather in
  places you care about even while looking at somewhere else.
- **Severe weather risk scoring** — each day gets a 5-tier risk score matching NOAA Storm
  Prediction Center's own categorical outlook naming and order (Marginal → Slight → Enhanced →
  Moderate → High, shown as "X/5"), derived from forecasted weather codes (thunderstorms, hail),
  wind gusts, and precipitation probability. Surfaced as a banner for the next day Enhanced-or-
  higher risk is expected and used to pick which day the one-tap "Alert friends" action targets.
- **Today's Outlook row** — a compact "Slight Risk · 2/5" summary on the Home tab; tap it to jump
  straight to the full Storm Outlook.
- **Storm Risk Meter** — a color-zoned gauge on the Home tab visualizing today's risk score at a
  glance across all 5 tiers, needle-driven by the same scoring above.
- **Storm Arrival Timer** — when rain is genuinely about to start, a prominent countdown card
  ("Storms arriving in N MIN, around H:MM") appears above the regular nowcast card.
- **Saved Locations list** — every saved city shown with its own live temperature and condition
  icon (fetched independently of whichever location is active), tap any row to switch to it.
- **Live Radar** — a real animated radar view (RainViewer tiles over an OpenStreetMap/CARTO dark
  basemap via Leaflet) centered on the OKC metro, with play/pause through the last several radar
  frames, a timestamp + "Now" indicator, an intensity legend, and labeled towns (Kingfisher,
  Guthrie, Edmond, El Reno, OKC, Norman, Chickasha, Purcell). A link to NWS's own
  radar.weather.gov loop for KTLX is included as the official-source fallback.
- **Regional storm outlook** — an embed of NOAA Storm Prediction Center's own Day 1–3 categorical
  convective outlook page, with a link to open it full-screen if it doesn't load. Reached from the
  More menu.
- **Storm Reports** — a crowd-sourced Reports tab where any signed-in user can submit what
  they're seeing (Tornado, Hail, Wind Damage, Flooding, Power Outage, Other) with a location,
  optional details, and an optional photo. Reports start as pending and only appear in the
  public "Recent Reports" feed once the owner approves them from a moderation queue on the same
  tab; rejected/pending reports stay visible only to their author and the owner. Needs one-time
  setup — see **Setup: enabling Storm Reports** below.
- **Will's Weather Desk** — a personal message card on the Home tab where the owner can post a
  short note to every user (e.g. "Scattered storms possible this evening — stay weather aware!"),
  with a timestamp and an inline edit form; the card is hidden entirely if no message has been
  posted yet. Needs the same Firestore rules setup as Storm Reports — see **Setup: enabling Storm
  Reports** below.
- **Storm Safety** — a static, always-available reference card on the Home tab covering Watch vs.
  Warning, Tornado Safety, Hail Safety, and a Preparedness Checklist, each expandable in place.
  No sign-in or network dependency beyond the app shell.
- **My Subscriptions** — reached from the More menu, lets any signed-in user mute/unmute alerts
  per saved location (without removing it) and manage the same per-warning-type notification
  toggles from one screen, alongside adding new locations.
- **Settings** — a dedicated screen (More → Settings) covering account email, notification status,
  quick links into Alert Preferences and Manage Counties, an Invite Friends share action, app
  theme (dark-only today), an About panel, and Logout.
- **Alerts dashboard** — an overview card (alerts sent, sent this week, friend count, last alert
  sent), a sent-alert history with filter tabs (All/Warnings/Watches/Others) and expandable
  full-message cards. Only visible to the owner's account.
- **Create Alert** — reached via the red **+** button in the bottom nav (owner only): quick-alert
  presets for common warning types (Tornado Warning/Watch, Severe T-Storm Warning/Watch, Flash
  Flood Warning, High Wind Warning) that pre-fill the composer, pick the day/severity, an optional
  personal note, preview the exact message, and send it. Alerts go out through your own Messages
  app (`sms:` links), and friend data never leaves your browser (stored in `localStorage`).
- **Per-friend delivery choice** — when adding a friend, pick whether they get alerts by text or
  through the shared Discord channel; Discord friends skip the phone number entirely and are
  automatically excluded from the text-recipient list (they're already covered by the Discord
  post).
- **Discord alerts** — optionally paste a channel webhook URL to also post every alert straight
  to a Discord channel, with a one-tap test message to confirm it's wired up correctly.
- **Public Discord option** — the sign-in screen shows a "Join our Discord for storm alerts"
  link for anyone who doesn't want to create an account, so people can opt in to alerts without
  signing up or handing over a phone number.

## Navigation

The bottom nav is Dashboard / Alerts / **+** / Radar / More (owner) or just Dashboard / Radar /
More (everyone else, since Alerts and the **+** compose button are owner-only broadcast tools).
Dashboard, Alerts, and Radar are real swipeable pages, not one long scrolling document — a
compact status bar (icon, temperature, location) stays pinned at the top, with each tab's content
scrolling independently in between. Swipe left/right anywhere on a tab to page to the
next/previous one, in addition to tapping the tab bar. Swipes starting on the hourly-forecast
scroll strip or the location search results are ignored so they don't fight with those elements'
own gestures.

The **+** button always opens Create Alert directly, regardless of which tab you're on. Storm
Outlook, Storm Reports, My Subscriptions, and Settings all live one level down, behind **More** —
each has its own back arrow rather than its own nav icon, since they're reached far less often
than Dashboard/Alerts/Radar.

## Getting started

```bash
npm install
npm run dev
```

Then open the printed local URL. Build for production with `npm run build`.

## Setup: enabling Storm Reports

The Reports tab needs two things published in the Firebase console before it'll actually save
anything (submissions will silently fail until then — the rest of the app is unaffected):

1. **Firestore rules** — publish the contents of `firestore.rules` (Firestore Database → Rules).
   It now includes a `stormReports` collection: anyone signed in can create a report (always
   starting `pending`), approved reports are public, pending/rejected ones are only visible to
   their author and the owner account, and only the owner can change a report's status.
2. **Storage rules** — turn on Cloud Storage for the project if it isn't already, then publish
   the contents of `storage.rules` (Storage → Rules). It caps uploads at 10MB, requires an image
   content type, and only lets a signed-in user write into their own `storm-reports/{uid}/`
   folder — anyone can read a photo once they have its URL.

## Stack

Vite + React + TypeScript. All weather data — current conditions, hourly and multi-day forecast,
severe weather risk scoring, active alerts, and the primary forecast text — comes from the
National Weather Service's public API (api.weather.gov), free and keyless: current conditions
from the nearest live observation station, forecasts from the NWS office responsible for each
location (Norman/OUN for this app's Great Plains focus). Live Radar renders RainViewer's free
radar tile API over a Leaflet map (OpenStreetMap/CARTO dark basemap) with a link to NWS's own
radar.weather.gov loop (KTLX) as the official-source fallback, and the Storm Outlook screen embeds
NOAA's Storm Prediction Center outlook page directly. The only non-NWS calls are Open-Meteo's free
geocoding search, used purely to
turn a typed city name into coordinates — no weather data comes from it — and RainViewer/CARTO for
radar tiles and basemap imagery. Sunrise/sunset are
computed locally (NWS doesn't publish them) via the standard solar-position algorithm, accurate
to within about a quarter hour. Firebase Authentication handles sign-in, and Cloud Firestore
stores one small `subscribers/{uid}` record per signed-up user (email, phone, location) so the
owner can see who's signed up — see `firestore.rules` for the exact access rules (each user can
only write their own record; only the owner can read everyone's). Everything else (friends list,
alert history, saved locations, Discord webhook) stays in `localStorage` on the owner's device.
