import { doc, setDoc, deleteField, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import type { Location } from '../types';

// Safe to embed client-side — this is the whole point of the VAPID public
// key. Its matching private key lives only in the Cloud Function's config,
// never in this repo.
const VAPID_PUBLIC_KEY =
  'BAmTKqAEs5Ld7uMrKu7Gob6iVWP7iZpBUppUrnXpfAraG2iFNyLkUmBcz8HyqNtYPVIzTLRk03eQW0ezcsupccw';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i += 1) output[i] = rawData.charCodeAt(i);
  return output;
}

export function pushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window;
}

interface PushPrefs {
  locations: Location[];
  mutedLocationIds: string[];
  alertTypePrefs: Record<string, boolean>;
}

// Subscribes this browser to Web Push and writes the subscription (plus the
// data the server-side checker needs — locations, mutes, alert-type prefs)
// into pushSubscriptions/{uid}. This is what lets alerts arrive even when
// the app itself isn't open — a scheduled Cloud Function reads this doc
// instead of relying on the browser tab's own polling.
export async function subscribeToPush(uid: string, prefs: PushPrefs): Promise<void> {
  if (!pushSupported()) throw new Error('Push notifications are not supported in this browser.');
  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
    });
  }
  await setDoc(doc(db, 'pushSubscriptions', uid), {
    subscription: subscription.toJSON(),
    ...prefs,
    updatedAt: serverTimestamp(),
  });
}

export async function unsubscribeFromPush(uid: string): Promise<void> {
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) await subscription.unsubscribe();
  }
  await setDoc(
    doc(db, 'pushSubscriptions', uid),
    { subscription: deleteField(), updatedAt: serverTimestamp() },
    { merge: true },
  );
}

// Keeps the server-side copy of locations/mutes/alert-type prefs current
// whenever they change, so the Cloud Function always checks the right
// places with the right settings — independent of whether this device is
// the one that's actually subscribed to push.
export async function syncPushPrefs(uid: string, prefs: PushPrefs): Promise<void> {
  await setDoc(
    doc(db, 'pushSubscriptions', uid),
    { ...prefs, updatedAt: serverTimestamp() },
    { merge: true },
  );
}
