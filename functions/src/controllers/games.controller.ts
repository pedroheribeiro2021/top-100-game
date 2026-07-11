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
} from '../services/games.service';
import { RankingGenerationError } from '../services/ranking.service';
import { listThemes } from '../services/themes.service';

/**
 * ADR-0002: ranking (Top 100) só pode ser exposto quando o jogo termina.
 */
function toPublicGame(game: any) {
  if (game.status === 'FINISHED') return game;

  const { ranking, ...publicGame } = game;
  return publicGame;
}

export async function createGameHandler(req: Request, res: Response) {
  try {
    const { theme, themeId, random } = req.body;

    if (!theme && !themeId && !random) {
      return res
        .status(400)
        .json({ error: 'Informe theme, themeId ou random=true' });
    }

    const game = await createGame({ theme, themeId, random });

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

    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function startGameHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const result = await startGame(id);

    return res.status(200).json(result);
  } catch (error: any) {
    if (error.message === 'GAME_NOT_FOUND') {
      return res.status(404).json({ error: 'Game not found' });
    }

    if (error.message === 'INVALID_GAME_STATE') {
      return res.status(400).json({ error: 'Game cannot be started' });
    }

    if (error.message === 'NO_PLAYERS') {
      return res
        .status(400)
        .json({ error: 'Cannot start game without players' });
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
