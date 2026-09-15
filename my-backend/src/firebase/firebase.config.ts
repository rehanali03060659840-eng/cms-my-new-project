import { initializeApp, cert, getApps, App } from 'firebase-admin/app';

export function initializeFirebase(): App {
  const apps = getApps();
  if (apps.length > 0) {
    return apps[0];
  }

  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const projectId = process.env.FIREBASE_PROJECT_ID;

  if (!privateKey || !clientEmail || !projectId) {
    console.warn(
      'Firebase credentials not fully configured (FIREBASE_PRIVATE_KEY/CLIENT_EMAIL/PROJECT_ID). Skipping initialization.',
    );
    return null as unknown as App;
  }

  // Replace escaped newlines from env vars
  const formattedKey = privateKey.replace(/\\n/g, '\n');

  return initializeApp({
    credential: cert({
      privateKey: formattedKey,
      clientEmail,
      projectId,
    }),
  });
}
