self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('message', (event) => {
  if (event.data?.type !== 'show-notification') return;
  const { title, options } = event.data;
  event.waitUntil(self.registration.showNotification(title, options));
});

// Fires from a real Web Push message sent by the scheduled Cloud Function —
// this is what lets an alert arrive even when no tab has the app open, since
// the browser wakes the service worker on its own for this event.
self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { title: 'Severe weather alert', body: event.data ? event.data.text() : '' };
  }
  const title = payload.title || 'Severe weather alert';
  event.waitUntil(
    self.registration.showNotification(title, {
      body: payload.body || '',
      icon: payload.icon || './logo-512.png',
      data: { url: payload.url || './' },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      if (clients.length > 0) return clients[0].focus();
      return self.clients.openWindow('./');
    }),
  );
});
