// CRITICAL: Configure emulator BEFORE any Firebase imports
// This must be at the very top of the file, before any imports
const isLocalDev =
  process.env.NODE_ENV === 'development' || process.env.PORT === '5001';
if (isLocalDev) {
  process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
  process.env.FIREBASE_PROJECT_ID = 'top-100-game';
  process.env.GCLOUD_PROJECT = 'top-100-game';
  process.env.GOOGLE_APPLICATION_CREDENTIALS = '';
  process.env.FIREBASE_CONFIG = JSON.stringify({
    projectId: 'top-100-game',
    databaseURL: 'https://top-100-game.firebaseio.com',
    storageBucket: 'top-100-game.firebasestorage.app',
    authEmulatorHost: 'localhost:9099',
    firestoreEmulatorHost: 'localhost:8080',
  });
}

// Load .env file BEFORE any other imports
import fs from 'fs';
import path from 'path';

const possibleEnvPaths = [
  path.resolve(__dirname, '../.env'),
  path.resolve(__dirname, '../../.env'),
];

for (const envPath of possibleEnvPaths) {
  if (!fs.existsSync(envPath)) continue;

  const content = fs.readFileSync(envPath, 'utf-8');
  const lines = content.split('\n');

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const separatorIndex = line.indexOf('=');
    if (separatorIndex <= 0) continue;

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }

  break;
}

// Now import Firebase after env is loaded
import * as functions from 'firebase-functions';
import express from 'express';

import { gamesRoutes } from './routes/games.routes';
import { checkRankingProviders } from './services/ranking.service';

function configureCors(app: express.Express) {
  const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.use((req, res, next) => {
    const requestOrigin = req.headers.origin;

    if (!requestOrigin || allowedOrigins.includes(requestOrigin)) {
      if (requestOrigin) {
        res.header('Access-Control-Allow-Origin', requestOrigin);
      }

      res.header('Vary', 'Origin');
      res.header(
        'Access-Control-Allow-Methods',
        'GET,POST,PUT,PATCH,DELETE,OPTIONS',
      );
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.header('Access-Control-Allow-Credentials', 'true');

      if (req.method === 'OPTIONS') {
        return res.status(204).send('');
      }

      return next();
    }

    return res.status(403).json({ error: 'Origin not allowed by CORS policy' });
  });
}

const app = express();

configureCors(app);
app.use(express.json());

app.use('/games', gamesRoutes);
app.use('/api/games', gamesRoutes);

app.get('/health', (_, res) => {
  res.json({ status: 'ok' });
});

app.get('/health/providers', async (_, res) => {
  try {
    const result = await checkRankingProviders();
    const statusCode = result.ok ? 200 : 503;
    res.status(statusCode).json(result);
  } catch (error) {
    console.error('Failed to check ranking providers', error);
    res
      .status(500)
      .json({ ok: false, error: 'Failed to check ranking providers' });
  }
});

export const api = functions.https.onRequest(app);

if (require.main === module) {
  const port = process.env.PORT || 5001;
  app.listen(port, () => {
    console.log(`Server started on port ${port}`);
  });
}
