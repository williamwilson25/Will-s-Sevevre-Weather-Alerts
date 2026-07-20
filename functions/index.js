const { onSchedule } = require('firebase-functions/v2/scheduler');
const { onDocumentCreated } = require('firebase-functions/v2/firestore');
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
    }))
    .filter((alert) => alert.id);
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

      for (const loc of locations) {
        if (mutedLocationIds.includes(loc.id)) continue;

        let alerts;
        try {
          alerts = await fetchActiveAlerts(loc.latitude, loc.longitude);
        } catch (err) {
          logger.warn(`NWS fetch failed for ${loc.name}`, err);
          continue;
        }

        for (const alert of alerts) {
          if (notifiedAlertIds.has(alert.id)) continue;
          const key = alertTypeKeyFor(alert.event);
          if (!key || !alertTypePrefs[key]) continue;

          const payload = JSON.stringify({
            title: alert.event,
            body: `${alert.headline || alert.description.slice(0, 120)} — ${loc.name}`,
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
