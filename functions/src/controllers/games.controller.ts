/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from 'express';
import {
  createGame,
  getGameById,
  joinGame,
  startGame,
  submitAnswer,
  advanceRound,
  ThemeNotFoundError,
  ALLOWED_ROUND_COUNTS,
  ALLOWED_ROUND_TIME_LIMITS,
} from '../services/games.service';
import { RankingGenerationError } from '../services/ranking.service';
import { listThemes } from '../services/themes.service';

/**
 * ADR-0002: ranking (Top 100) só pode ser exposto quando o jogo termina.
 */
function toPublicGame(game: any) {
  if (game.status === 'FINISHED') return game;

  // usedItems guarda valores normalizados do ranking — também precisa ficar oculto.
  const { ranking, usedItems, ...publicGame } = game;
  return publicGame;
}

export async function createGameHandler(req: Request, res: Response) {
  try {
    const { theme, themeId, random, hostName, maxRounds, roundTimeLimit } =
      req.body;

    if (!theme && !themeId && !random) {
      return res
        .status(400)
        .json({ error: 'Informe theme, themeId ou random=true' });
    }

    if (!hostName || typeof hostName !== 'string' || !hostName.trim()) {
      return res.status(400).json({ error: 'Informe hostName' });
    }

    if (
      maxRounds !== undefined &&
      !ALLOWED_ROUND_COUNTS.includes(maxRounds)
    ) {
      return res
        .status(400)
        .json({ error: 'maxRounds deve ser 3, 5, 7 ou 10' });
    }

    if (
      roundTimeLimit !== undefined &&
      !ALLOWED_ROUND_TIME_LIMITS.includes(roundTimeLimit)
    ) {
      return res
        .status(400)
        .json({ error: 'roundTimeLimit deve ser 15, 30, 45 ou 60' });
    }

    const game = await createGame({
      theme,
      themeId,
      random,
      hostName,
      maxRounds,
      roundTimeLimit,
    });

    return res.status(201).json(toPublicGame(game));
  } catch (error) {
    if (error instanceof ThemeNotFoundError) {
      return res.status(404).json({
        error: 'Tema não encontrado no banco',
        suggestions: error.suggestions,
      });
    }

    if (error instanceof RankingGenerationError) {
      console.error('Ranking generation unavailable', error.details);

      return res.status(503).json({
        error:
          'Nenhum provedor gratuito conseguiu gerar esse tema agora. Tente novamente em alguns instantes.',
        details: error.details,
      });
    }

    if (error instanceof Error && error.message === 'THEME_ID_NOT_FOUND') {
      return res.status(404).json({ error: 'Tema não encontrado' });
    }

    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function listThemesHandler(req: Request, res: Response) {
  return res.status(200).json(listThemes());
}

export async function getGameHandler(req: Request, res: Response) {
  const { id } = req.params;

  const game = await getGameById(id);

  if (!game) {
    return res.status(404).json({ error: 'Game not found' });
  }

  return res.status(200).json(toPublicGame(game));
}

export async function joinGameHandler(req: Request, res: Response) {
  try {
    const { gameCode, playerName } = req.body;

    if (!gameCode || !playerName) {
      return res
        .status(400)
        .json({ error: 'gameCode and playerName are required' });
    }

    const player = await joinGame(gameCode, playerName);

    return res.status(200).json(player);
  } catch (error: any) {
    if (error.message === 'GAME_NOT_FOUND') {
      return res.status(404).json({ error: 'Game not found' });
    }

    if (error.message === 'GAME_ALREADY_STARTED') {
      return res.status(400).json({ error: 'Game already started' });
    }

    if (error.message === 'GAME_FULL') {
      return res
        .status(400)
        .json({ error: 'Sala cheia (máximo 5 jogadores)' });
    }

    if (error.message === 'NAME_TAKEN') {
      return res
        .status(400)
        .json({ error: 'Já existe um jogador com esse nome nesta sala' });
    }

    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function startGameHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { playerId } = req.body;

    if (!playerId) {
      return res.status(400).json({ error: 'playerId is required' });
    }

    const result = await startGame(id, playerId);

    return res.status(200).json(result);
  } catch (error: any) {
    if (error.message === 'GAME_NOT_FOUND') {
      return res.status(404).json({ error: 'Game not found' });
    }

    if (error.message === 'INVALID_GAME_STATE') {
      return res.status(400).json({ error: 'Game cannot be started' });
    }

    if (error.message === 'NOT_HOST') {
      return res
        .status(403)
        .json({ error: 'Apenas o host pode iniciar a partida' });
    }

    if (error.message === 'NOT_ENOUGH_PLAYERS') {
      return res
        .status(400)
        .json({ error: 'É necessário pelo menos 2 jogadores para iniciar' });
    }

    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function submitAnswerHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { playerId, answer } = req.body;

    const result = await submitAnswer(id, playerId, answer);

    return res.status(200).json(result);
  } catch (error: any) {
    if (error.message === 'ROUND_EXPIRED') {
      return res.status(400).json({ error: 'Tempo da rodada esgotado' });
    }

    return res.status(400).json({ error: error.message });
  }
}

/**
 * 🔥 NOVO ENDPOINT: ADVANCE ROUND
 */
export async function advanceRoundHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const result = await advanceRound(id);

    return res.status(200).json(result);
  } catch (error: any) {
    if (error.message === 'GAME_NOT_FOUND') {
      return res.status(404).json({ error: 'Game not found' });
    }

    if (error.message === 'INVALID_GAME_STATE') {
      return res.status(400).json({ error: 'Invalid game state' });
    }

    if (error.message === 'ROUND_NOT_READY') {
      return res.status(400).json({ error: 'Round not ready to advance' });
    }

    return res.status(500).json({ error: 'Internal server error' });
  }
}
