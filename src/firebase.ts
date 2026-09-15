import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
  apiKey: 'AIzaSyAQ8o6BNR8V5DIdgml-P5EB7-lpICqGek8',
  authDomain: 'wills-severe-weather-alerts.firebaseapp.com',
  projectId: 'wills-severe-weather-alerts',
  storageBucket: 'wills-severe-weather-alerts.firebasestorage.app',
  messagingSenderId: '905467059263',
  appId: '1:905467059263:web:587de4c318059bb819ac8a',
};

export const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
// Matches the Cloud Functions' region (functions/index.js) — the default
// "us-central1" region works without this, but pinning it explicitly keeps
// it correct if that ever changes.
export const functions = getFunctions(firebaseApp, 'us-central1');

export const DISCORD_INVITE_URL = 'https://discord.gg/gYeuhd38y';
