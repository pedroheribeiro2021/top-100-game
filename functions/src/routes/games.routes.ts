import { Router } from 'express';
import {
  addBotHandler,
  advanceRoundHandler,
  createGameHandler,
  getGameByCodeHandler,
  getGameHandler,
  joinGameHandler,
  pauseRoundHandler,
  rematchGameHandler,
  removeBotHandler,
  startGameHandler,
  submitAnswerHandler,
} from '../controllers/games.controller';

export const gamesRoutes = Router();

gamesRoutes.post('/', createGameHandler);
gamesRoutes.get('/code/:code', getGameByCodeHandler);
gamesRoutes.get('/:id', getGameHandler);
gamesRoutes.post('/join', joinGameHandler);
gamesRoutes.post('/:id/start', startGameHandler);
gamesRoutes.post('/:id/bots', addBotHandler);
gamesRoutes.delete('/:id/bots/:botId', removeBotHandler);
gamesRoutes.post('/:id/answer', submitAnswerHandler);
gamesRoutes.post('/:id/pause', pauseRoundHandler(true));
gamesRoutes.post('/:id/resume', pauseRoundHandler(false));
gamesRoutes.post('/:id/advance', advanceRoundHandler);
gamesRoutes.post('/:id/rematch', rematchGameHandler);
