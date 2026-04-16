import * as functions from 'firebase-functions';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { gamesRoutes } from './routes/games.routes';

function loadLocalEnvFile() {
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
}

loadLocalEnvFile();

const app = express();

app.use(express.json());

app.use('/games', gamesRoutes);

app.get('/health', (_, res) => {
  res.json({ status: 'ok' });
});

export const api = functions.https.onRequest(app);

if (require.main === module) {
  const port = process.env.PORT || 5001;
  app.listen(port, () => {
    console.log(`Server started on port ${port}`);
  });
}
