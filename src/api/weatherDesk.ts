import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

const DOC_PATH = ['siteContent', 'weatherDesk'] as const;

export interface WeatherDeskMessage {
  message: string;
  updatedAt: string;
}

export function watchWeatherDesk(onChange: (msg: WeatherDeskMessage | null) => void): () => void {
  return onSnapshot(
    doc(db, ...DOC_PATH),
    (snap) => {
      if (!snap.exists()) {
        onChange(null);
        return;
      }
      const data = snap.data();
      const updatedAt = data.updatedAt as { toDate?: () => Date } | undefined;
      onChange({
        message: String(data.message ?? ''),
        updatedAt: updatedAt?.toDate?.().toISOString() ?? new Date().toISOString(),
      });
    },
    () => onChange(null),
  );
}

export async function updateWeatherDesk(message: string): Promise<void> {
  await setDoc(doc(db, ...DOC_PATH), { message, updatedAt: serverTimestamp() });
}
