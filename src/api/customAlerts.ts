import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import type { AlertSeverity } from '../types';

// Writes a doc the sendCustomAlert Cloud Function watches for and pushes
// immediately to each recipient's device via Web Push — the in-app
// notification path for friends who've signed up and enabled push,
// alongside the text/Discord delivery methods.
export async function sendAppNotification(
  ownerUid: string,
  recipientUids: string[],
  headline: string,
  body: string,
  severity: AlertSeverity,
): Promise<void> {
  const write = addDoc(collection(db, 'customAlerts'), {
    createdBy: ownerUid,
    recipientUids,
    headline,
    body,
    severity,
    createdAt: serverTimestamp(),
  });
  // Unlike a plain fetch (e.g. the Discord webhook), a Firestore write with
  // no connectivity can retry silently for a long time rather than
  // rejecting — so the composer's "Sending…" state needs its own timeout to
  // avoid hanging forever.
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Timed out reaching the server.')), 10000),
  );
  await Promise.race([write, timeout]);
}
