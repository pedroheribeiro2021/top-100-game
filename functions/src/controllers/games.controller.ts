/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from 'express';
import {
  createGame,
  getGameById,
  joinGame,
  startGame,
  submitAnswer,
} from '../services/games.service';

export async function createGameHandler(req: Request, res: Response) {
  try {
    const { theme } = req.body;

    if (!theme) {
      return res.status(400).json({ error: 'Theme is required' });
    }

    const game = await createGame(theme);

    return res.status(201).json(game);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getGameHandler(req: Request, res: Response) {
  const { id } = req.params;

  const game = await getGameById(id);

  if (!game) {
    return res.status(404).json({ error: 'Game not found' });
  }

  return res.status(200).json(game);
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
