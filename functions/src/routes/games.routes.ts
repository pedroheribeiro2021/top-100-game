import { Router } from 'express';
import {
  advanceRoundHandler,
  createGameHandler,
  getGameHandler,
  joinGameHandler,
  startGameHandler,
  submitAnswerHandler,
} from '../controllers/games.controller';

export const gamesRoutes = Router();

gamesRoutes.post('/', createGameHandler);
gamesRoutes.get('/:id', getGameHandler);
gamesRoutes.post('/join', joinGameHandler);
gamesRoutes.post('/:id/start', startGameHandler);
gamesRoutes.post('/:id/answer', submitAnswerHandler);
gamesRoutes.post('/:id/advance', advanceRoundHandler);
