import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { db, storage } from '../firebase';
import type { StormReport, StormReportStatus, StormReportType } from '../types';

const COLLECTION = 'stormReports';

function fromDoc(id: string, data: Record<string, unknown>): StormReport {
  const createdAt = data.createdAt as { toDate?: () => Date } | undefined;
  return {
    id,
    type: (data.type as StormReportType) ?? 'other',
    locationName: String(data.locationName ?? ''),
    description: String(data.description ?? ''),
    photoUrl: (data.photoUrl as string | null) ?? null,
    status: (data.status as StormReportStatus) ?? 'pending',
    submittedByUid: String(data.submittedByUid ?? ''),
    submittedByEmail: String(data.submittedByEmail ?? ''),
    createdAt: createdAt?.toDate?.().toISOString() ?? new Date().toISOString(),
  };
}

export async function submitStormReport(params: {
  uid: string;
  email: string;
  type: StormReportType;
  locationName: string;
  description: string;
  photo?: File | null;
}): Promise<void> {
  let photoUrl: string | null = null;
  if (params.photo) {
    const path = `storm-reports/${params.uid}/${Date.now()}-${params.photo.name}`;
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, params.photo);
    photoUrl = await getDownloadURL(storageRef);
  }

  await addDoc(collection(db, COLLECTION), {
    type: params.type,
    locationName: params.locationName,
    description: params.description,
    photoUrl,
    status: 'pending',
    submittedByUid: params.uid,
    submittedByEmail: params.email,
    createdAt: serverTimestamp(),
  });
}

export function watchApprovedReports(onChange: (reports: StormReport[]) => void): () => void {
  const q = query(collection(db, COLLECTION), where('status', '==', 'approved'), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => onChange(snapshot.docs.map((d) => fromDoc(d.id, d.data()))),
    () => {
      // rules not published yet, or offline — leave the list empty rather than crash
    },
  );
}

export function watchPendingReports(onChange: (reports: StormReport[]) => void): () => void {
  const q = query(collection(db, COLLECTION), where('status', '==', 'pending'), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => onChange(snapshot.docs.map((d) => fromDoc(d.id, d.data()))),
    () => {
      // owner-only read; silently ignore if rules reject a non-owner listener
    },
  );
}

export async function moderateStormReport(id: string, status: 'approved' | 'rejected'): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), { status });
}
