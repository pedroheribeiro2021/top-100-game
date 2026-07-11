import * as admin from 'firebase-admin';
import fs from 'fs';
import { db as mockDb } from './firestore-mock';

// Check for local development mode
const isLocalDev =
  process.env.NODE_ENV === 'development' ||
  process.env.PORT === '5001' ||
  !process.env.GOOGLE_APPLICATION_CREDENTIALS ||
  process.env.GOOGLE_APPLICATION_CREDENTIALS === '';

function getFirebaseCredential() {
  const firebaseServiceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const firebaseServiceAccountPath =
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS;

  if (firebaseServiceAccountJson) {
    return admin.credential.cert(JSON.parse(firebaseServiceAccountJson));
  }

  if (firebaseServiceAccountPath && fs.existsSync(firebaseServiceAccountPath)) {
    const serviceAccountJson = fs.readFileSync(
      firebaseServiceAccountPath,
      'utf-8',
    );
    return admin.credential.cert(JSON.parse(serviceAccountJson));
  }

  return null;
}

function initializeFirestore() {
  // Local dev without real Firebase credentials: use the in-memory mock.
  if (isLocalDev) {
    return mockDb as unknown as FirebaseFirestore.Firestore;
  }

  if (!admin.apps.length) {
    const credential = getFirebaseCredential();

    if (credential) {
      admin.initializeApp({
        credential,
        projectId:
          process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT,
      });
    } else {
      admin.initializeApp();
    }
  }

  return admin.firestore();
}

export const db = initializeFirestore();
export { admin };
