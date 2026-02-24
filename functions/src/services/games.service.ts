import { db } from '../config/firestore';
import { randomUUID } from 'crypto';
import { generateGameCode } from '../utils/generateGameCode';
import { generateRanking } from './generateRanking';

export async function createGame(theme: string) {
  const id = randomUUID();
  const gameCode = generateGameCode();

  const ranking = await generateRanking(theme);

  const game = {
    id,
    theme,
    status: 'RANKING_READY',
    players: [],
    ranking,
    currentRound: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    gameCode,
  };

  await db.collection('games').doc(id).set(game);

  return game;
}

export async function getGameById(id: string) {
  const doc = await db.collection('games').doc(id).get();

  if (!doc.exists) return null;

  return doc.data();
}

export async function getGameByCode(code: string) {
  const snapshot = await db
    .collection('games')
    .where('gameCode', '==', code)
    .limit(1)
    .get();

  if (snapshot.empty) return null;

  return snapshot.docs[0].data();
}
