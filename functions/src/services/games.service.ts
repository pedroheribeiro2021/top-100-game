/* eslint-disable @typescript-eslint/no-explicit-any */
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

export async function joinGame(gameCode: string, playerName: string) {
  const snapshot = await db
    .collection('games')
    .where('gameCode', '==', gameCode)
    .limit(1)
    .get();

  if (snapshot.empty) {
    throw new Error('GAME_NOT_FOUND');
  }

  const doc = snapshot.docs[0];
  const game = doc.data();

  if (game.status !== 'RANKING_READY') {
    throw new Error('GAME_ALREADY_STARTED');
  }

  const newPlayer = {
    id: randomUUID(),
    name: playerName,
    score: 0,
  };

  const updatedPlayers = [...(game.players || []), newPlayer];

  await db.collection('games').doc(doc.id).update({
    players: updatedPlayers,
    updatedAt: new Date(),
  });

  return newPlayer;
}

export async function startGame(gameId: string) {
  const doc = await db.collection('games').doc(gameId).get();

  if (!doc.exists) {
    throw new Error('GAME_NOT_FOUND');
  }

  const game = doc.data();

  if (!game) {
    throw new Error('GAME_NOT_FOUND');
  }

  if (game.status !== 'RANKING_READY') {
    throw new Error('INVALID_GAME_STATE');
  }

  if (!game.players || game.players.length === 0) {
    throw new Error('NO_PLAYERS');
  }

  await db.collection('games').doc(gameId).update({
    status: 'STARTED',
    currentRound: 1,
    currentRoundAnswers: [],
    updatedAt: new Date(),
  });

  return {
    message: 'Game started',
    currentRound: 1,
  };
}

export async function submitAnswer(
  gameId: string,
  playerId: string,
  answer: string,
) {
  const doc = await db.collection('games').doc(gameId).get();

  if (!doc.exists) throw new Error('GAME_NOT_FOUND');

  const game = doc.data();

  if (!game) throw new Error('GAME_NOT_FOUND');

  if (game.status === 'FINISHED') throw new Error('GAME_FINISHED');

  if (game.status !== 'STARTED') throw new Error('INVALID_GAME_STATE');

  const player = game.players.find((p: any) => p.id === playerId);

  if (!player) throw new Error('PLAYER_NOT_FOUND');

  const alreadyAnswered = (game.currentRoundAnswers || []).some(
    (a: any) => a.playerId === playerId,
  );

  if (alreadyAnswered) throw new Error('ALREADY_ANSWERED');

  const rankingItem = game.ranking.find(
    (item: any) => item.value.toLowerCase() === answer.toLowerCase(),
  );

  const points = rankingItem ? rankingItem.position : 0;

  const newAnswer = {
    playerId,
    answer,
    points,
  };

  const updatedAnswers = [...(game.currentRoundAnswers || []), newAnswer];

  let updatedPlayers = game.players;
  let nextRound = game.currentRound;
  let newStatus = game.status;
  const maxRounds = 5;

  // 🔥 Se todos responderam
  if (updatedAnswers.length === game.players.length) {
    // somar pontos
    updatedPlayers = game.players.map((player: any) => {
      const playerAnswer = updatedAnswers.find(
        (a: any) => a.playerId === player.id,
      );

      return {
        ...player,
        score: player.score + (playerAnswer?.points || 0),
      };
    });

    nextRound = game.currentRound + 1;

    if (nextRound > maxRounds) {
      newStatus = 'FINISHED';
    }
  }

  let winner = null;

  if (newStatus === 'FINISHED') {
    const sortedPlayers = [...updatedPlayers].sort((a, b) => b.score - a.score);

    winner = sortedPlayers[0];
  }

  await db
    .collection('games')
    .doc(gameId)
    .update({
      players: updatedPlayers,
      currentRoundAnswers:
        updatedAnswers.length === game.players.length ? [] : updatedAnswers,
      currentRound: nextRound,
      status: newStatus,
      winner: winner || null,
      updatedAt: new Date(),
    });

  return newAnswer;
}
