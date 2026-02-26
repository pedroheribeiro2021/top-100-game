import * as functions from 'firebase-functions'
import express from 'express'
import { gamesRoutes } from './routes/games.routes'

const app = express()

app.use(express.json())

app.use('/games', gamesRoutes)

app.get('/health', (_, res) => {
  res.json({ status: 'ok' })
})

export const api = functions.https.onRequest(app)
