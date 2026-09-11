const { onSchedule } = require('firebase-functions/v2/scheduler');
const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const logger = require('firebase-functions/logger');
const admin = require('firebase-admin');
const webpush = require('web-push');

admin.initializeApp();
const db = admin.firestore();

// Safe to hardcode — this is the public half of the VAPID key pair, the
// same one baked into the client at src/api/pushSubscriptions.ts. The
// private half is a secret, set via `firebase functions:secrets:set` and
// read below through defineSecret, never committed to this repo.
const VAPID_PUBLIC_KEY =
  'BAmTKqAEs5Ld7uMrKu7Gob6iVWP7iZpBUppUrnXpfAraG2iFNyLkUmBcz8HyqNtYPVIzTLRk03eQW0ezcsupccw';
const vapidPrivateKey = defineSecret('VAPID_PRIVATE_KEY');

// web-push validates the key pair synchronously and throws if the private
// key secret is missing, empty, or malformed — every push pathway below
// calls this first, so a bad secret previously surfaced as an opaque
// "internal" error with no indication *why*. Logging here means the real
// cause (missing/invalid VAPID_PRIVATE_KEY secret) shows up in Cloud
// Functions logs instead of just crashing silently.
function configureVapid() {
  try {
    webpush.setVapidDetails('mailto:williamwilson25@icloud.com', VAPID_PUBLIC_KEY, vapidPrivateKey.value());
  } catch (err) {
    logger.error('VAPID key setup failed — check the VAPID_PRIVATE_KEY secret (firebase functions:secrets:set VAPID_PRIVATE_KEY)', err);
    throw err;
  }
}

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

// Mirrors src/utils/nwsWeatherCode.ts + src/utils/weatherCategory.ts (just
// enough to answer "is this text describing active rain/storm right now?")
// — kept as plain code here rather than a shared module since this function
// is a separate Node package from the Vite client bundle.
const PRECIP_TEXT_RULES = [
  [/tornado/i, true],
  [/severe\s+thunderstorm|thunderstorm.*hail|hail.*thunderstorm/i, true],
  [/thunderstorm|tstorm/i, true],
  [/blizzard|heavy snow|snow showers|light snow|snow/i, false],
  [/freezing rain|ice storm|sleet/i, true],
  [/freezing drizzle/i, true],
  [/heavy rain/i, true],
  [/rain showers|showers/i, true],
  [/light rain|chance rain|slight chance/i, true],
  [/rain|shower/i, true],
  [/drizzle/i, true],
];

function isPrecipitatingText(text) {
  for (const [pattern, isPrecip] of PRECIP_TEXT_RULES) {
    if (pattern.test(text)) return isPrecip;
  }
  return false;
}

// Mirrors src/utils/nowcast.ts's ONSET_INTENSITY — see that file for why 40.
const RAIN_ONSET_INTENSITY = 40;

async function fetchPointMeta(latitude, longitude) {
  const res = await fetch(`https://api.weather.gov/points/${latitude},${longitude}`, {
    headers: { Accept: 'application/geo+json' },
  });
  if (!res.ok) throw new Error(`NWS point lookup failed (${res.status})`);
  const data = await res.json();
  const p = data.properties || {};
  if (!p.forecastHourly || !p.observationStations) throw new Error('No NWS coverage for this location');
  return { forecastHourly: p.forecastHourly, observationStations: p.observationStations };
}

async function fetchHourlyPop(forecastHourlyUrl) {
  const res = await fetch(forecastHourlyUrl, { headers: { Accept: 'application/geo+json' } });
  if (!res.ok) throw new Error(`NWS hourly forecast fetch failed (${res.status})`);
  const data = await res.json();
  const periods = data.properties?.periods || [];
  const a = periods[0]?.probabilityOfPrecipitation?.value ?? 0;
  const b = periods[1]?.probabilityOfPrecipitation?.value ?? a;
  return { a, b };
}

async function fetchCurrentlyPrecipitating(observationStationsUrl) {
  const stationsRes = await fetch(observationStationsUrl, { headers: { Accept: 'application/geo+json' } });
  if (!stationsRes.ok) throw new Error(`NWS station lookup failed (${stationsRes.status})`);
  const stationsData = await stationsRes.json();
  const stationId = stationsData.features?.[0]?.properties?.stationIdentifier;
  if (!stationId) return false;
  const obsRes = await fetch(`https://api.weather.gov/stations/${stationId}/observations/latest`, {
    headers: { Accept: 'application/geo+json' },
  });
  if (!obsRes.ok) return false;
  const obsData = await obsRes.json();
  return isPrecipitatingText(obsData.properties?.textDescription || '');
}

// Mirrors src/utils/nowcast.ts's buildNwsNowcast + summarizeNowcast combined
// into one step, since the server only needs the resulting state (not a
// chart to render) — same 6-point/10-minute interpolation and threshold.
function computeRainState(a, b, currentlyPrecipitating) {
  if (currentlyPrecipitating || a >= RAIN_ONSET_INTENSITY) {
    return { kind: 'raining' };
  }
  for (let i = 1; i < 6; i += 1) {
    const value = a + (b - a) * (i / 5);
    if (value >= RAIN_ONSET_INTENSITY) {
      return { kind: 'starting', minutesAway: i * 10 };
    }
  }
  return { kind: 'clear' };
}

async function fetchRainState(latitude, longitude) {
  const { forecastHourly, observationStations } = await fetchPointMeta(latitude, longitude);
  const [{ a, b }, currentlyPrecipitating] = await Promise.all([
    fetchHourlyPop(forecastHourly),
    fetchCurrentlyPrecipitating(observationStations),
  ]);
  return computeRainState(a, b, currentlyPrecipitating);
}

// Matches the wording just added to the client's own "Rain expected soon"
// notification (src/App.tsx) — an actual clock time instead of "in N min".
function formatRainBody(locationLabel, state, timeZone) {
  if (state.kind === 'raining') {
    return `Rain is happening now in ${locationLabel}.`;
  }
  const startsAt = new Date(Date.now() + state.minutesAway * 60000);
  const timeLabel = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  }).format(startsAt);
  return `${locationLabel}: Intermittent rain and thunderstorms will begin around ${timeLabel}.`;
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
    try {
      configureVapid();
    } catch {
      // Nothing downstream can succeed without a valid VAPID key — bail
      // out instead of running the whole subscriber loop for no reason.
      return;
    }

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
      const priorRainState = data.rainState || {};
      const rainState = { ...priorRainState };
      let rainStateChanged = false;
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

        // Mirrors the client's "Rain expected soon"/"Rain is starting"
        // local notification (src/App.tsx), but server-side so it still
        // arrives with the app closed — gated on the same notifyRain
        // preference, synced into this doc by PushNotificationToggle.
        if (data.notifyRain && !subscriptionGone) {
          try {
            const state = await fetchRainState(loc.latitude, loc.longitude);
            const priorKind = priorRainState[loc.id];
            if ((state.kind === 'raining' || state.kind === 'starting') && priorKind !== state.kind) {
              const payload = JSON.stringify({
                title: state.kind === 'raining' ? 'Rain is starting' : 'Rain expected soon',
                body: formatRainBody(locationLabel, state, loc.timezone),
                url: './',
              });
              try {
                await webpush.sendNotification(data.subscription, payload);
              } catch (err) {
                if (err.statusCode === 404 || err.statusCode === 410) {
                  subscriptionGone = true;
                } else {
                  logger.warn(`Rain push failed for ${docSnap.id}`, err);
                }
              }
            }
            if (rainState[loc.id] !== state.kind) {
              rainState[loc.id] = state.kind;
              rainStateChanged = true;
            }
          } catch (err) {
            logger.warn(`Rain check failed for ${loc.name}`, err);
          }
        }
      }

      if (subscriptionGone) {
        writes.push(docSnap.ref.set({ subscription: admin.firestore.FieldValue.delete() }, { merge: true }));
      } else {
        const update = {};
        if (freshIds.length > 0) {
          update.notifiedAlertIds = [...notifiedAlertIds, ...freshIds].slice(-200);
        }
        if (rainStateChanged) {
          update.rainState = rainState;
        }
        if (Object.keys(update).length > 0) {
          writes.push(docSnap.ref.set(update, { merge: true }));
        }
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

    try {
      configureVapid();
    } catch {
      return;
    }

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


// Round-trips the caller's own subscription through the real Web Push
// pipeline on demand — lets the app prove alerts will actually arrive with
// it closed, rather than only exercising the local Notification API the
// way the existing client-side "Test alert" button does. onCall (not
// onRequest) so Firebase verifies the caller's ID token for us and hands
// back a trustworthy request.auth.uid — no risk of test-pushing to someone
// else's device.
exports.sendTestPush = onCall(
  { region: 'us-central1', secrets: [vapidPrivateKey] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Sign in required.');
    }

    const subRef = db.collection('pushSubscriptions').doc(request.auth.uid);
    const subSnap = await subRef.get();
    const sub = subSnap.data();
    if (!sub || !sub.subscription) {
      throw new HttpsError('failed-precondition', 'Turn on Always-On Alerts first.');
    }

    try {
      configureVapid();
    } catch {
      throw new HttpsError(
        'internal',
        'Push is misconfigured on the server (VAPID key) — check Cloud Functions logs for "VAPID key setup failed".',
      );
    }

    const payload = JSON.stringify({
      title: 'Rain expected soon',
      body: 'Test push — this is what a real rain alert looks like, delivered even with the app closed.',
      url: './',
    });

    try {
      await webpush.sendNotification(sub.subscription, payload);
    } catch (err) {
      if (err.statusCode === 404 || err.statusCode === 410) {
        await subRef.set({ subscription: admin.firestore.FieldValue.delete() }, { merge: true });
        throw new HttpsError(
          'failed-precondition',
          'Your push subscription expired — toggle Always-On Alerts off and back on.',
        );
      }
      logger.warn('Test push failed', err);
      throw new HttpsError('internal', 'Push failed to send.');
    }

    return { ok: true };
  },
);
