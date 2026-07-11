// This file must be loaded BEFORE any Firebase imports
// Load this with: ts-node-dev -r ./src/env-config.ts src/index.ts

// Configure emulator for local development BEFORE any Firebase imports
const isLocalDev =
  process.env.NODE_ENV === 'development' || process.env.PORT === '5001';

if (isLocalDev) {
  process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
  process.env.FIREBASE_PROJECT_ID = 'top-100-game';
  process.env.GCLOUD_PROJECT = 'top-100-game';
  process.env.GOOGLE_APPLICATION_CREDENTIALS = ''; // Prevent default credential loading
  process.env.FIREBASE_CONFIG = JSON.stringify({
    projectId: 'top-100-game',
    databaseURL: 'https://top-100-game.firebaseio.com',
    storageBucket: 'top-100-game.firebasestorage.app',
    authEmulatorHost: 'localhost:9099',
    firestoreEmulatorHost: 'localhost:8080',
  });

  console.log('🔧 Running in local development mode with Firestore emulator');
}
