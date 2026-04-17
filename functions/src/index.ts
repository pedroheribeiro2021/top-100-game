import * as functions from 'firebase-functions'
import express from 'express'
import fs from 'fs'
import path from 'path'
import { gamesRoutes } from './routes/games.routes'

function loadLocalEnvFile() {
  const possibleEnvPaths = [
    path.resolve(__dirname, '../.env'),
    path.resolve(__dirname, '../../.env'),
  ]

  for (const envPath of possibleEnvPaths) {
    if (!fs.existsSync(envPath)) continue

    const content = fs.readFileSync(envPath, 'utf-8')
    const lines = content.split('\n')

    for (const rawLine of lines) {
      const line = rawLine.trim()
      if (!line || line.startsWith('#')) continue

      const separatorIndex = line.indexOf('=')
      if (separatorIndex <= 0) continue

      const key = line.slice(0, separatorIndex).trim()
      const value = line.slice(separatorIndex + 1).trim()

      if (!process.env[key]) {
        process.env[key] = value
      }
    }

    break
  }
}

function configureCors(app: express.Express) {
  const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)

  app.use((req, res, next) => {
    const requestOrigin = req.headers.origin

    if (!requestOrigin || allowedOrigins.includes(requestOrigin)) {
      if (requestOrigin) {
        res.header('Access-Control-Allow-Origin', requestOrigin)
      }

      res.header('Vary', 'Origin')
      res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
      res.header('Access-Control-Allow-Credentials', 'true')

      if (req.method === 'OPTIONS') {
        return res.status(204).send('')
      }

      return next()
    }

    return res.status(403).json({ error: 'Origin not allowed by CORS policy' })
  })
}

loadLocalEnvFile()

const app = express()

configureCors(app)
app.use(express.json())

app.use('/games', gamesRoutes)

app.get('/health', (_, res) => {
  res.json({ status: 'ok' })
})

export const api = functions.https.onRequest(app)
