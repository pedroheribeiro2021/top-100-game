import { Router } from 'express'
import { createGameHandler, getGameHandler } from '../controllers/games.controller'

export const gamesRoutes = Router()

gamesRoutes.post('/', createGameHandler)
gamesRoutes.get('/:id', getGameHandler)
