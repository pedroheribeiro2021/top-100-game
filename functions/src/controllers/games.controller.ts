import { Request, Response } from 'express'
import { createGame, getGameById } from '../services/games.service'

export async function createGameHandler(req: Request, res: Response) {
  const { theme } = req.body

  if (!theme) {
    return res.status(400).json({ error: 'Theme is required' })
  }

  const game = await createGame(theme)

  return res.status(201).json(game)
}

export async function getGameHandler(req: Request, res: Response) {
  const { id } = req.params

  const game = await getGameById(id)

  if (!game) {
    return res.status(404).json({ error: 'Game not found' })
  }

  return res.status(200).json(game)
}
