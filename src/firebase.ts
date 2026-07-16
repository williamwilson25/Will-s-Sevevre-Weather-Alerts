import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

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

export const OWNER_EMAIL = 'williamwilson25@icloud.com';
