// src/firebase/firebase.config.ts
import { initializeApp, cert, getApps, App } from 'firebase-admin/app';

export function initializeFirebase(): App {
  const apps = getApps();
  if (apps.length > 0) {
    return apps[0];
  }

  const keyPath = process.env.FIREBASE_KEY_PATH;

  if (!keyPath) {
    throw new Error('FIREBASE_KEY_PATH is not set in .env file');
  }

  return initializeApp({
    credential: cert(keyPath), // seedha file path — koi manual copy-paste nahi
  });
}