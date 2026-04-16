import * as admin from "firebase-admin";

const firebaseServiceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

if (!admin.apps.length) {
  if (firebaseServiceAccountJson) {
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(firebaseServiceAccountJson)),
    });
  } else {
    admin.initializeApp();
  }
}

export const db = admin.firestore();
