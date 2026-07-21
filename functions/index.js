const { onSchedule } = require('firebase-functions/v2/scheduler');
const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const logger = require('firebase-functions/logger');
const admin = require('firebase-admin');
const webpush = require('web-push');

admin.initializeApp();
const db = admin.firestore();

// Free account at signup.xweather.com — set both with
// `firebase functions:secrets:set XWEATHER_CLIENT_ID` / `XWEATHER_CLIENT_SECRET`.
const xweatherClientId = defineSecret('XWEATHER_CLIENT_ID');
const xweatherClientSecret = defineSecret('XWEATHER_CLIENT_SECRET');

// Safe to hardcode — this is the public half of the VAPID key pair, the
// same one baked into the client at src/api/pushSubscriptions.ts. The
// private half is a secret, set via `firebase functions:secrets:set` and
// read below through defineSecret, never committed to this repo.
const VAPID_PUBLIC_KEY =
  'BAmTKqAEs5Ld7uMrKu7Gob6iVWP7iZpBUppUrnXpfAraG2iFNyLkUmBcz8HyqNtYPVIzTLRk03eQW0ezcsupccw';
const vapidPrivateKey = defineSecret('VAPID_PRIVATE_KEY');

// Mirrors src/utils/alertTypes.ts — kept as a plain array here rather than a
// shared module since this function is a separate Node package from the
// Vite client bundle. If you add a new alert-type toggle in the app, mirror
// it here too.
const ALERT_TYPE_CONFIGS = [
  { key: 'tornado_warning', match: (event) => event === 'Tornado Warning' },
  { key: 'severe_tstorm_warning', match: (event) => event === 'Severe Thunderstorm Warning' },
  { key: 'flash_flood_warning', match: (event) => event === 'Flash Flood Warning' },
  { key: 'tornado_watch', match: (event) => event === 'Tornado Watch' },
  { key: 'severe_tstorm_watch', match: (event) => event === 'Severe Thunderstorm Watch' },
  { key: 'high_wind_warning', match: (event) => event === 'High Wind Warning' },
  { key: 'winter_weather', match: (event) => /winter|snow|ice|freez|blizzard/i.test(event) },
  { key: 'other_warnings', match: (event) => /\bwarning$/i.test(event) },
];

function alertTypeKeyFor(event) {
  const config = ALERT_TYPE_CONFIGS.find((c) => c.match(event));
  return config ? config.key : null;
}

async function fetchActiveAlerts(latitude, longitude) {
  const url = `https://api.weather.gov/alerts/active?point=${latitude},${longitude}&status=actual&message_type=alert,update`;
  const res = await fetch(url, { headers: { Accept: 'application/geo+json' } });
  if (!res.ok) throw new Error(`NWS alerts fetch failed (${res.status})`);
  const data = await res.json();
  return (data.features || [])
    .map((f) => ({
      id: f.id || f.properties?.id || '',
      event: f.properties?.event || 'Weather Alert',
      headline: f.properties?.headline || f.properties?.event || '',
      description: f.properties?.description || '',
      expires: f.properties?.expires || null,
    }))
    .filter((alert) => alert.id);
}

// Matches the wording of iOS's own Weather app NWS notifications — e.g.
// "Extreme Heat Warning / Near your location / These conditions are
// expected by 12:00 PM, Jul 21. (National Weather Service)" — so ours read
// the same way instead of a raw NWS headline dump.
function formatAlertBody(alert, locationLabel, timeZone) {
  if (alert.expires) {
    try {
      const date = new Date(alert.expires);
      const time = new Intl.DateTimeFormat('en-US', { timeZone, hour: 'numeric', minute: '2-digit' }).format(date);
      const day = new Intl.DateTimeFormat('en-US', { timeZone, month: 'short', day: 'numeric' }).format(date);
      return `${locationLabel}. These conditions are expected by ${time}, ${day}. (National Weather Service)`;
    } catch {
      // Fall through to the headline-based body below.
    }
  }
  const summary = alert.headline || alert.description.slice(0, 120);
  return `${locationLabel}. ${summary} (National Weather Service)`;
}

// Runs every 5 minutes regardless of whether anyone has the app open —
// this is the piece that makes alerts "always on" rather than only firing
// while a browser tab is polling NWS itself.
exports.checkSevereWeatherAlerts = onSchedule(
  { schedule: 'every 5 minutes', region: 'us-central1', secrets: [vapidPrivateKey], timeoutSeconds: 120 },
  async () => {
    webpush.setVapidDetails(
      'mailto:williamwilson25@icloud.com',
      VAPID_PUBLIC_KEY,
      vapidPrivateKey.value(),
    );

    const snapshot = await db.collection('pushSubscriptions').get();
    const writes = [];

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      if (!data.subscription) continue;

      const locations = Array.isArray(data.locations) ? data.locations : [];
      const mutedLocationIds = Array.isArray(data.mutedLocationIds) ? data.mutedLocationIds : [];
      const alertTypePrefs = data.alertTypePrefs || {};
      const notifiedAlertIds = new Set(
        Array.isArray(data.notifiedAlertIds) ? data.notifiedAlertIds : [],
      );
      const freshIds = [];
      let subscriptionGone = false;

      for (const [locIndex, loc] of locations.entries()) {
        if (mutedLocationIds.includes(loc.id)) continue;

        let alerts;
        try {
          alerts = await fetchActiveAlerts(loc.latitude, loc.longitude);
        } catch (err) {
          logger.warn(`NWS fetch failed for ${loc.name}`, err);
          continue;
        }

        // The first saved location is "home" (mirrors src/App.tsx's
        // homeLocation), so it reads as "Near your location" the way iOS's
        // own Weather app does for your primary location; any other saved
        // town is named explicitly, also matching that pattern.
        const locationLabel = locIndex === 0 ? 'Near your location' : loc.name;

        for (const alert of alerts) {
          if (notifiedAlertIds.has(alert.id)) continue;
          const key = alertTypeKeyFor(alert.event);
          if (!key || !alertTypePrefs[key]) continue;

          const payload = JSON.stringify({
            title: alert.event,
            body: formatAlertBody(alert, locationLabel, loc.timezone),
            url: './',
          });

          try {
            await webpush.sendNotification(data.subscription, payload);
            freshIds.push(alert.id);
          } catch (err) {
            if (err.statusCode === 404 || err.statusCode === 410) {
              // The browser unsubscribed or the subscription expired —
              // clear it so we stop trying to push to a dead endpoint.
              subscriptionGone = true;
            } else {
              logger.warn(`Push send failed for ${docSnap.id}`, err);
            }
          }
        }
      }

      if (subscriptionGone) {
        writes.push(docSnap.ref.set({ subscription: admin.firestore.FieldValue.delete() }, { merge: true }));
      } else if (freshIds.length > 0) {
        const updated = [...notifiedAlertIds, ...freshIds].slice(-200);
        writes.push(docSnap.ref.set({ notifiedAlertIds: updated }, { merge: true }));
      }
    }

    await Promise.all(writes);
  },
);

// Fires the moment the owner sends an alert with "App notification" chosen
// as the delivery method for one or more friends (see src/api/customAlerts.ts)
// — pushes it to each recipient's device immediately, same delivery
// mechanism as the scheduled severe-weather checker above but triggered by
// a Firestore write instead of a timer.
exports.sendCustomAlert = onDocumentCreated(
  // Pinned to match checkSevereWeatherAlerts above — without an explicit
  // region, this Firestore-triggered (Eventarc) function was auto-assigned
  // us-south1 by the deploy tooling, which is restricted for this project
  // and failed to deploy.
  { document: 'customAlerts/{alertId}', region: 'us-central1', secrets: [vapidPrivateKey] },
  async (event) => {
    const data = event.data?.data();
    if (!data) return;

    const recipientUids = Array.isArray(data.recipientUids) ? data.recipientUids : [];
    if (recipientUids.length === 0) return;

    webpush.setVapidDetails(
      'mailto:williamwilson25@icloud.com',
      VAPID_PUBLIC_KEY,
      vapidPrivateKey.value(),
    );

    const payload = JSON.stringify({
      title: data.headline || 'New alert',
      body: data.body || '',
      url: './',
    });

    await Promise.all(
      recipientUids.map(async (uid) => {
        const subRef = db.collection('pushSubscriptions').doc(uid);
        const subSnap = await subRef.get();
        const sub = subSnap.data();
        if (!sub || !sub.subscription) return;

        try {
          await webpush.sendNotification(sub.subscription, payload);
        } catch (err) {
          if (err.statusCode === 404 || err.statusCode === 410) {
            await subRef.set({ subscription: admin.firestore.FieldValue.delete() }, { merge: true });
          } else {
            logger.warn(`Custom alert push failed for ${uid}`, err);
          }
        }
      }),
    );
  },
);

const EARTH_RADIUS_MI = 3958.8;

function haversineMiles(lat1, lon1, lat2, lon2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return EARTH_RADIUS_MI * 2 * Math.asin(Math.sqrt(a));
}

function bearingCompass(deg) {
  if (typeof deg !== 'number' || Number.isNaN(deg)) return null;
  const points = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return points[Math.round(((deg % 360) + 360) % 360 / 45) % 8];
}

// Normalizes an Xweather /stormcells/closest cell into just what the
// StormTrackerCard needs. Xweather's exact field names weren't verifiable
// against a live response while building this (no API key yet) — several
// candidate paths are checked per field so this degrades gracefully rather
// than throwing if the real shape differs slightly; revisit once a real key
// is live and we can see an actual payload.
function normalizeStormCell(cell, pointLat, pointLon) {
  const cellLat = cell.loc?.lat ?? cell.lat ?? null;
  const cellLon = cell.loc?.long ?? cell.loc?.lon ?? cell.long ?? cell.lon ?? null;
  const distanceMi =
    typeof cellLat === 'number' && typeof cellLon === 'number'
      ? haversineMiles(pointLat, pointLon, cellLat, cellLon)
      : null;

  const details = cell.details || {};
  const speedMph = details.speedMPH ?? details.speedMph ?? details.speed ?? null;
  const bearingDeg = details.bearingDEG ?? details.bearingDeg ?? null;
  const bearing = details.bearingENG ?? bearingCompass(bearingDeg);

  const etaMinutes =
    distanceMi != null && typeof speedMph === 'number' && speedMph > 2
      ? Math.round((distanceMi / speedMph) * 60)
      : null;

  const traits = cell.traits || {};
  const hailProbability = traits.hailProbability ?? traits.hail?.probability ?? null;
  const hailSizeIn = traits.maxHailSizeIN ?? traits.maxHailSizeIn ?? traits.hail?.maxSizeIn ?? null;
  const rotation = Boolean(traits.rotation ?? traits.rotationDetected ?? traits.tvs ?? false);

  return {
    id: cell.id || `${cellLat},${cellLon}`,
    distanceMi: distanceMi != null ? Math.round(distanceMi) : null,
    bearing: bearing || null,
    speedMph: typeof speedMph === 'number' ? Math.round(speedMph) : null,
    etaMinutes,
    hailProbability: typeof hailProbability === 'number' ? Math.round(hailProbability) : null,
    hailSizeIn: typeof hailSizeIn === 'number' ? hailSizeIn : null,
    rotation,
  };
}

const STORM_CELLS_CACHE_TTL_MS = 3 * 60 * 1000;

// Public, read-only, non-sensitive weather lookup by lat/lon — no auth
// required, same trust model as the free NWS/Open-Meteo calls the client
// already makes directly. Cached per rounded coordinate for a few minutes
// so nearby users (and repeated dashboard refreshes) share one upstream
// call rather than each burning into the free 15k/month Xweather quota.
exports.getStormCells = onRequest(
  { region: 'us-central1', secrets: [xweatherClientId, xweatherClientSecret], cors: true },
  async (req, res) => {
    const lat = Number(req.query.lat);
    const lon = Number(req.query.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      res.status(400).json({ error: 'lat and lon query params are required' });
      return;
    }

    const cacheKey = `${lat.toFixed(2)},${lon.toFixed(2)}`;
    const cacheRef = db.collection('stormCellsCache').doc(cacheKey);

    try {
      const cached = await cacheRef.get();
      if (cached.exists) {
        const data = cached.data();
        if (Date.now() - (data.fetchedAt?.toMillis?.() ?? 0) < STORM_CELLS_CACHE_TTL_MS) {
          res.json({ cells: data.cells || [] });
          return;
        }
      }

      const url =
        `https://data.api.xweather.com/stormcells/closest?p=${lat},${lon}&radius=75miles&limit=8` +
        `&client_id=${xweatherClientId.value()}&client_secret=${xweatherClientSecret.value()}`;
      const upstream = await fetch(url);
      const body = await upstream.json();
      if (!upstream.ok || body.success === false) {
        throw new Error(body.error?.description || `Xweather request failed (${upstream.status})`);
      }

      const cells = (body.response || []).map((cell) => normalizeStormCell(cell, lat, lon));
      await cacheRef.set({ cells, fetchedAt: admin.firestore.FieldValue.serverTimestamp() });
      res.json({ cells });
    } catch (err) {
      logger.warn('getStormCells failed', err);
      res.status(502).json({ error: 'Unable to fetch storm cells right now.' });
    }
  },
);
