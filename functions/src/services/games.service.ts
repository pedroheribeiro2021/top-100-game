/* eslint-disable @typescript-eslint/no-explicit-any */
import { db } from '../config/firestore';
import { randomUUID } from 'crypto';
import { generateGameCode } from '../utils/generateGameCode';
import { generateRanking } from './ranking.service';
import { normalize, findRankingItem } from './matching';
import {
  ThemeBank,
  ThemeSummary,
  getRandomTheme,
  getThemeById,
  resolveThemeByQuery,
} from './themes.service';

const MAX_ROUNDS = 5;
const ROUND_TIME_LIMIT_SECONDS = 180;
const ENABLE_AI_FALLBACK = process.env.ENABLE_AI_FALLBACK === 'true';

export class ThemeNotFoundError extends Error {
  constructor(readonly suggestions: ThemeSummary[]) {
    super('THEME_NOT_FOUND');
  }
}

type CreateGameInput = {
  theme?: string;
  themeId?: string;
  random?: boolean;
};

type ResolvedGameTheme = {
  title: string;
  themeId: string | null;
  ranking: { position: number; value: string; aliases?: string[] }[];
  source: 'bank' | 'groq' | 'openrouter';
  warning: string | null;
};

function toRankingItems(theme: ThemeBank) {
  return theme.items.map((item) => ({
    position: item.position,
    value: item.value,
    aliases: item.aliases,
  }));
}

async function resolveGameTheme(input: CreateGameInput): Promise<ResolvedGameTheme> {
  if (input.random) {
    const theme = getRandomTheme();
    return {
      title: theme.title,
      themeId: theme.id,
      ranking: toRankingItems(theme),
      source: 'bank',
      warning: null,
    };
  }

  if (input.themeId) {
    const theme = getThemeById(input.themeId);
    if (!theme) throw new Error('THEME_ID_NOT_FOUND');

    return {
      title: theme.title,
      themeId: theme.id,
      ranking: toRankingItems(theme),
      source: 'bank',
      warning: null,
    };
  }

  const query = input.theme;
  if (!query) throw new Error('THEME_REQUIRED');

  const match = resolveThemeByQuery(query);
  if (match.matched) {
    return {
      title: match.theme.title,
      themeId: match.theme.id,
      ranking: toRankingItems(match.theme),
      source: 'bank',
      warning: null,
    };
  }

  if (ENABLE_AI_FALLBACK) {
    const aiResult = await generateRanking(query);
    return {
      title: query,
      themeId: null,
      ranking: aiResult.ranking,
      source: aiResult.source,
      warning: aiResult.warning,
    };
  }

  throw new ThemeNotFoundError(match.suggestions);
}

type RoundAnswer = {
  playerId: string;
  answer: string;
  points: number;
  alreadyUsed: boolean;
};

function getNextRoundDeadline() {
  return new Date(Date.now() + ROUND_TIME_LIMIT_SECONDS * 1000);
}

function scorePlayers(players: any[], roundAnswers: RoundAnswer[]) {
  return players.map((player: any) => {
    const playerAnswer = roundAnswers.find((a: any) => a.playerId === player.id);

    return {
      ...player,
      score: player.score + (playerAnswer?.points || 0),
    };
  });
}

function buildRoundHistoryEntry(
  round: number,
  roundAnswers: RoundAnswer[],
  players: any[],
) {
  const ranking = [...players].sort((a, b) => b.score - a.score);

  return {
    round,
    answers: roundAnswers,
    ranking,
  };
}

export async function createGame(input: CreateGameInput) {
  const id = randomUUID();
  const gameCode = generateGameCode();
  const resolvedTheme = await resolveGameTheme(input);

  const game = {
    id,
    theme: resolvedTheme.title,
    themeId: resolvedTheme.themeId,
    status: 'RANKING_READY',
    roundPhase: null,
    players: [],
    ranking: resolvedTheme.ranking,
    rankingSource: resolvedTheme.source,
    rankingWarning: resolvedTheme.warning,
    currentRound: 0,
    currentRoundAnswers: [],
    usedItems: [],
    roundHistory: [],
    roundDeadlineAt: null,
    winner: null,
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

  if (!doc.exists) throw new Error('GAME_NOT_FOUND');

  const game = doc.data();
  if (!game) throw new Error('GAME_NOT_FOUND');

  if (game.status !== 'RANKING_READY') {
    throw new Error('INVALID_GAME_STATE');
  }

  if (!game.players || game.players.length === 0) {
    throw new Error('NO_PLAYERS');
  }

  const roundDeadlineAt = getNextRoundDeadline();

  await db.collection('games').doc(gameId).update({
    status: 'STARTED',
    roundPhase: 'ANSWERING',
    currentRound: 1,
    currentRoundAnswers: [],
    usedItems: [],
    roundHistory: [],
    roundDeadlineAt,
    updatedAt: new Date(),
  });

  return {
    message: 'Game started',
    currentRound: 1,
    roundDeadlineAt,
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
  if (game.roundPhase !== 'ANSWERING')
    throw new Error('ROUND_NOT_ACCEPTING_ANSWERS');

  const player = game.players.find((p: any) => p.id === playerId);
  if (!player) throw new Error('PLAYER_NOT_FOUND');

  const alreadyAnswered = (game.currentRoundAnswers || []).some(
    (a: any) => a.playerId === playerId,
  );

  if (alreadyAnswered) throw new Error('ALREADY_ANSWERED');

  const rankingItem = findRankingItem(game.ranking, answer);
  const usedItems: string[] = game.usedItems || [];
  const normalizedValue = rankingItem ? normalize(rankingItem.value) : null;
  const alreadyUsed = normalizedValue !== null && usedItems.includes(normalizedValue);
  const points = rankingItem && !alreadyUsed ? rankingItem.position : 0;

  const newAnswer = {
    playerId,
    answer,
    points,
    alreadyUsed,
  };

  const updatedUsedItems =
    normalizedValue && !alreadyUsed ? [...usedItems, normalizedValue] : usedItems;

  const updatedAnswers = [...(game.currentRoundAnswers || []), newAnswer];

  let updatedPlayers = game.players;
  let newStatus = game.status;
  let winner = game.winner || null;
  let nextRound = game.currentRound;
  let nextRoundPhase = 'ANSWERING';
  let nextRoundAnswers = updatedAnswers;
  let nextRoundDeadline = game.roundDeadlineAt || null;
  const roundHistory = [...(game.roundHistory || [])];

  if (updatedAnswers.length === game.players.length) {
    updatedPlayers = scorePlayers(game.players, updatedAnswers);

    roundHistory.push(
      buildRoundHistoryEntry(game.currentRound, updatedAnswers, updatedPlayers),
    );

    // Última rodada -> encerra jogo
    if (game.currentRound >= MAX_ROUNDS) {
      newStatus = 'FINISHED';

      const sortedPlayers = [...updatedPlayers].sort((a, b) => b.score - a.score);
      winner = sortedPlayers[0];

      nextRoundPhase = 'RESULT';
      nextRoundAnswers = updatedAnswers;
      nextRoundDeadline = null;
    } else {
      // Avanço automático para próxima rodada
      nextRound = game.currentRound + 1;
      nextRoundPhase = 'ANSWERING';
      nextRoundAnswers = [];
      nextRoundDeadline = getNextRoundDeadline();
    }
  }

  await db.collection('games').doc(gameId).update({
    players: updatedPlayers,
    currentRound: nextRound,
    currentRoundAnswers: nextRoundAnswers,
    usedItems: updatedUsedItems,
    roundPhase: nextRoundPhase,
    roundHistory,
    roundDeadlineAt: nextRoundDeadline,
    status: newStatus,
    winner,
    updatedAt: new Date(),
  });

  return newAnswer;
}

/**
 * Avança rodada manualmente (fallback para cenários de timeout/uso administrativo)
 */
export async function advanceRound(gameId: string) {
  const doc = await db.collection('games').doc(gameId).get();
  if (!doc.exists) throw new Error('GAME_NOT_FOUND');

  const game = doc.data();
  if (!game) throw new Error('GAME_NOT_FOUND');

  if (game.status !== 'STARTED') throw new Error('INVALID_GAME_STATE');

  const scoredPlayers = scorePlayers(game.players, game.currentRoundAnswers || []);
  const roundHistory = [...(game.roundHistory || [])];

  roundHistory.push(
    buildRoundHistoryEntry(
      game.currentRound,
      game.currentRoundAnswers || [],
      scoredPlayers,
    ),
  );

  if (game.currentRound >= MAX_ROUNDS) {
    const sortedPlayers = [...scoredPlayers].sort((a, b) => b.score - a.score);

    await db.collection('games').doc(gameId).update({
      players: scoredPlayers,
      currentRoundAnswers: game.currentRoundAnswers || [],
      roundPhase: 'RESULT',
      roundHistory,
      roundDeadlineAt: null,
      status: 'FINISHED',
      winner: sortedPlayers[0],
      updatedAt: new Date(),
    });

    return { message: 'Game finished', currentRound: game.currentRound };
  }

  const nextRound = game.currentRound + 1;

  await db.collection('games').doc(gameId).update({
    players: scoredPlayers,
    currentRound: nextRound,
    currentRoundAnswers: [],
    roundPhase: 'ANSWERING',
    roundHistory,
    roundDeadlineAt: getNextRoundDeadline(),
    updatedAt: new Date(),
  });

  return { message: 'Round advanced', currentRound: nextRound };
}
