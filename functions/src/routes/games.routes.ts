import { Router } from 'express'
import { createGameHandler, getGameHandler, joinGameHandler, startGameHandler } from '../controllers/games.controller'

export const gamesRoutes = Router()

gamesRoutes.post('/', createGameHandler)
gamesRoutes.get('/:id', getGameHandler)
gamesRoutes.post('/join', joinGameHandler)
gamesRoutes.post('/:id/start', startGameHandler)
