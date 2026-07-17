import { collection, doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import type { Location, Subscriber } from '../types';

export async function saveSubscriber(uid: string, email: string, phone: string, location: Location): Promise<void> {
  await setDoc(doc(db, 'subscribers', uid), {
    email,
    phone,
    location,
    createdAt: serverTimestamp(),
  });
}

export function watchSubscribers(onChange: (subscribers: Subscriber[]) => void): () => void {
  return onSnapshot(
    collection(db, 'subscribers'),
    (snapshot) => {
      const subscribers = snapshot.docs.map((d) => {
        const data = d.data() as Omit<Subscriber, 'uid'>;
        return { uid: d.id, ...data };
      });
      onChange(subscribers);
    },
    () => {
      // owner-only read; silently ignore if rules reject a non-owner listener
    },
  );
}
