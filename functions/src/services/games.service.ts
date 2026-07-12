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

export const ALLOWED_ROUND_COUNTS = [3, 5, 7, 10] as const;
export const ALLOWED_ROUND_TIME_LIMITS = [15, 30, 45, 60] as const;
export const DEFAULT_MAX_ROUNDS = 5;
export const DEFAULT_ROUND_TIME_LIMIT_SECONDS = 30;
const MAX_PLAYERS = 5;
const ENABLE_AI_FALLBACK = process.env.ENABLE_AI_FALLBACK === 'true';

export class ThemeNotFoundError extends Error {
  constructor(readonly suggestions: ThemeSummary[]) {
    super('THEME_NOT_FOUND');
  }
}

type ThemeSelection = {
  theme?: string;
  themeId?: string;
  random?: boolean;
};

type CreateGameInput = ThemeSelection & {
  hostName: string;
  maxRounds?: number;
  roundTimeLimit?: number;
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

async function resolveGameTheme(input: ThemeSelection): Promise<ResolvedGameTheme> {
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

function getNextRoundDeadline(roundTimeLimitSeconds: number) {
  return new Date(Date.now() + roundTimeLimitSeconds * 1000);
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

function toMillis(value: any): number {
  if (value instanceof Date) return value.getTime();
  if (typeof value?.toMillis === 'function') return value.toMillis();
  if (typeof value?.toDate === 'function') return value.toDate().getTime();
  return new Date(value).getTime();
}

function isRoundExpired(game: any): boolean {
  if (game.roundPhase !== 'ANSWERING') return false;
  if (!game.roundDeadlineAt) return false;

  return toMillis(game.roundDeadlineAt) <= Date.now();
}

/**
 * Jogadores que ainda disputam a partida: todos numa rodada normal,
 * só os empatados durante MORTE_SUBITA (DOMAIN §6).
 */
function getActivePlayerIds(game: any): string[] {
  if (game.status === 'SUDDEN_DEATH') return game.tiedPlayerIds || [];
  return (game.players || []).map((p: any) => p.id);
}

/**
 * Fecha a rodada atual: pontua quem respondeu, ausentes ficam em 0
 * (DOMAIN §3). Usado pelo avanço manual, pela expiração lazy e por
 * submitAnswer quando todos os jogadores ativos já responderam.
 *
 * Ao fechar a última rodada normal ou uma rodada de morte súbita, detecta
 * empate na liderança entre os jogadores ativos: se houver mais de um
 * líder, o jogo entra/continua em SUDDEN_DEATH só entre os empatados
 * (DOMAIN §6); senão, encerra com o vencedor único.
 */
function buildRoundClosureUpdate(game: any) {
  const scoredPlayers = scorePlayers(game.players, game.currentRoundAnswers || []);
  const roundHistory = [...(game.roundHistory || [])];

  roundHistory.push(
    buildRoundHistoryEntry(
      game.currentRound,
      game.currentRoundAnswers || [],
      scoredPlayers,
    ),
  );

  const isLastNormalRound =
    game.status === 'STARTED' && game.currentRound >= game.maxRounds;
  const isSuddenDeathRound = game.status === 'SUDDEN_DEATH';

  if (isLastNormalRound || isSuddenDeathRound) {
    const contenderIds = isSuddenDeathRound
      ? game.tiedPlayerIds || []
      : scoredPlayers.map((p: any) => p.id);
    const contenders = scoredPlayers.filter((p: any) => contenderIds.includes(p.id));
    const maxScore = Math.max(...contenders.map((p: any) => p.score));
    const tiedPlayers = contenders.filter((p: any) => p.score === maxScore);

    if (tiedPlayers.length > 1) {
      return {
        players: scoredPlayers,
        currentRound: game.currentRound + 1,
        currentRoundAnswers: [],
        roundPhase: 'ANSWERING',
        roundHistory,
        roundDeadlineAt: getNextRoundDeadline(game.roundTimeLimit),
        status: 'SUDDEN_DEATH',
        tiedPlayerIds: tiedPlayers.map((p: any) => p.id),
        winner: null,
        updatedAt: new Date(),
      };
    }

    return {
      players: scoredPlayers,
      currentRound: game.currentRound,
      currentRoundAnswers: game.currentRoundAnswers || [],
      roundPhase: 'RESULT',
      roundHistory,
      roundDeadlineAt: null,
      status: 'FINISHED',
      tiedPlayerIds: [],
      winner: tiedPlayers[0],
      updatedAt: new Date(),
    };
  }

  return {
    players: scoredPlayers,
    currentRound: game.currentRound + 1,
    currentRoundAnswers: [],
    roundPhase: 'ANSWERING',
    roundHistory,
    roundDeadlineAt: getNextRoundDeadline(game.roundTimeLimit),
    status: game.status,
    tiedPlayerIds: game.tiedPlayerIds || [],
    winner: game.winner || null,
    updatedAt: new Date(),
  };
}

export async function createGame(input: CreateGameInput) {
  const id = randomUUID();
  const gameCode = generateGameCode();
  const resolvedTheme = await resolveGameTheme(input);
  const hostId = randomUUID();

  const game = {
    id,
    theme: resolvedTheme.title,
    themeId: resolvedTheme.themeId,
    status: 'RANKING_READY',
    roundPhase: null,
    hostId,
    maxRounds: input.maxRounds ?? DEFAULT_MAX_ROUNDS,
    roundTimeLimit: input.roundTimeLimit ?? DEFAULT_ROUND_TIME_LIMIT_SECONDS,
    players: [{ id: hostId, name: input.hostName, score: 0 }],
    ranking: resolvedTheme.ranking,
    rankingSource: resolvedTheme.source,
    rankingWarning: resolvedTheme.warning,
    currentRound: 0,
    currentRoundAnswers: [],
    usedItems: [],
    tiedPlayerIds: [],
    roundHistory: [],
    roundDeadlineAt: null,
    winner: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    gameCode,
    rematchGameId: null,
  };

  await db.collection('games').doc(id).set(game);

  return game;
}

/**
 * Sem Cloud Scheduler (custo zero, ADR-0001): a expiração da rodada é
 * aplicada de forma lazy, na primeira request que chegar após o
 * `roundDeadlineAt` (getGameById via polling, ou submitAnswer). A
 * transação garante que duas requests concorrentes não fecham a rodada
 * duas vezes.
 */
export async function applyRoundTimeoutIfNeeded(gameId: string) {
  const docRef = db.collection('games').doc(gameId);

  return db.runTransaction(async (transaction: any) => {
    const snapshot = await transaction.get(docRef);
    if (!snapshot.exists) return null;

    const game = snapshot.data();
    if (!game || !isRoundExpired(game)) return game;

    const update = buildRoundClosureUpdate(game);
    transaction.update(docRef, update);

    return { ...game, ...update };
  });
}

export async function getGameById(id: string) {
  return applyRoundTimeoutIfNeeded(id);
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

  const existingPlayers: any[] = game.players || [];

  if (existingPlayers.length >= MAX_PLAYERS) {
    throw new Error('GAME_FULL');
  }

  const normalizedName = playerName.trim().toLowerCase();
  const nameTaken = existingPlayers.some(
    (p: any) => p.name.trim().toLowerCase() === normalizedName,
  );

  if (nameTaken) {
    throw new Error('NAME_TAKEN');
  }

  const newPlayer = {
    id: randomUUID(),
    name: playerName,
    score: 0,
  };

  const updatedPlayers = [...existingPlayers, newPlayer];

  await db.collection('games').doc(doc.id).update({
    players: updatedPlayers,
    updatedAt: new Date(),
  });

  return newPlayer;
}

export async function startGame(gameId: string, playerId: string) {
  const doc = await db.collection('games').doc(gameId).get();

  if (!doc.exists) throw new Error('GAME_NOT_FOUND');

  const game = doc.data();
  if (!game) throw new Error('GAME_NOT_FOUND');

  if (game.status !== 'RANKING_READY') {
    throw new Error('INVALID_GAME_STATE');
  }

  if (playerId !== game.hostId) {
    throw new Error('NOT_HOST');
  }

  if (!game.players || game.players.length < 2) {
    throw new Error('NOT_ENOUGH_PLAYERS');
  }

  const roundDeadlineAt = getNextRoundDeadline(game.roundTimeLimit);

  await db.collection('games').doc(gameId).update({
    status: 'STARTED',
    roundPhase: 'ANSWERING',
    currentRound: 1,
    currentRoundAnswers: [],
    usedItems: [],
    tiedPlayerIds: [],
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
  if (game.status !== 'STARTED' && game.status !== 'SUDDEN_DEATH')
    throw new Error('INVALID_GAME_STATE');

  if (isRoundExpired(game)) {
    await applyRoundTimeoutIfNeeded(gameId);
    throw new Error('ROUND_EXPIRED');
  }

  if (game.roundPhase !== 'ANSWERING')
    throw new Error('ROUND_NOT_ACCEPTING_ANSWERS');

  const player = game.players.find((p: any) => p.id === playerId);
  if (!player) throw new Error('PLAYER_NOT_FOUND');

  const activePlayerIds = getActivePlayerIds(game);

  if (!activePlayerIds.includes(playerId)) {
    throw new Error('NOT_IN_SUDDEN_DEATH');
  }

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

  const allActiveAnswered = activePlayerIds.every((id: string) =>
    updatedAnswers.some((a: any) => a.playerId === id),
  );

  const update = allActiveAnswered
    ? buildRoundClosureUpdate({ ...game, currentRoundAnswers: updatedAnswers })
    : {
        players: game.players,
        currentRound: game.currentRound,
        currentRoundAnswers: updatedAnswers,
        roundPhase: game.roundPhase,
        roundHistory: game.roundHistory || [],
        roundDeadlineAt: game.roundDeadlineAt || null,
        status: game.status,
        tiedPlayerIds: game.tiedPlayerIds || [],
        winner: game.winner || null,
        updatedAt: new Date(),
      };

  await db.collection('games').doc(gameId).update({
    ...update,
    usedItems: updatedUsedItems,
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

  if (game.status !== 'STARTED' && game.status !== 'SUDDEN_DEATH')
    throw new Error('INVALID_GAME_STATE');

  const update = buildRoundClosureUpdate(game);
  await db.collection('games').doc(gameId).update(update);

  if (update.status === 'FINISHED') {
    return { message: 'Game finished', currentRound: game.currentRound };
  }

  return { message: 'Round advanced', currentRound: update.currentRound };
}

/**
 * "Jogar novamente" (DOMAIN §6): cria um novo documento para o mesmo grupo
 * de jogadores (pontuações e usedItems zerados, tema novo), e aponta o
 * jogo finalizado antigo para ele (`rematchGameId`) para que os demais
 * clientes, que só sabem pollar o jogo antigo, sigam automaticamente.
 */
export async function rematchGame(
  gameId: string,
  hostId: string,
  themeSelection: ThemeSelection = {},
) {
  const doc = await db.collection('games').doc(gameId).get();
  if (!doc.exists) throw new Error('GAME_NOT_FOUND');

  const game = doc.data();
  if (!game) throw new Error('GAME_NOT_FOUND');

  if (game.status !== 'FINISHED') throw new Error('GAME_NOT_FINISHED');
  if (hostId !== game.hostId) throw new Error('NOT_HOST');

  const hasThemeSelection =
    themeSelection.theme || themeSelection.themeId || themeSelection.random;
  const resolvedTheme = await resolveGameTheme(
    hasThemeSelection ? themeSelection : { random: true },
  );

  const newId = randomUUID();

  const newGame = {
    id: newId,
    theme: resolvedTheme.title,
    themeId: resolvedTheme.themeId,
    status: 'RANKING_READY',
    roundPhase: null,
    hostId: game.hostId,
    maxRounds: game.maxRounds,
    roundTimeLimit: game.roundTimeLimit,
    players: (game.players || []).map((p: any) => ({ ...p, score: 0 })),
    ranking: resolvedTheme.ranking,
    rankingSource: resolvedTheme.source,
    rankingWarning: resolvedTheme.warning,
    currentRound: 0,
    currentRoundAnswers: [],
    usedItems: [],
    tiedPlayerIds: [],
    roundHistory: [],
    roundDeadlineAt: null,
    winner: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    gameCode: generateGameCode(),
    rematchGameId: null,
  };

  await db.collection('games').doc(newId).set(newGame);

  await db.collection('games').doc(gameId).update({
    rematchGameId: newId,
    updatedAt: new Date(),
  });

  return newGame;
}
