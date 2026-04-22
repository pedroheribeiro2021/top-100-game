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
  const configuredOrigins = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)

  const allowAllOrigins = configuredOrigins.length === 0

  app.use((req, res, next) => {
    const requestOrigin = req.headers.origin

    if (!requestOrigin) {
      if (req.method === 'OPTIONS') {
        return res.status(204).send('')
      }

      return next()
    }

    const isAllowedOrigin = allowAllOrigins || configuredOrigins.includes(requestOrigin)

    if (!isAllowedOrigin) {
      return res.status(403).json({ error: 'Origin not allowed by CORS policy' })
    }

    res.header('Access-Control-Allow-Origin', requestOrigin)
    res.header('Vary', 'Origin')
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    if (req.method === 'OPTIONS') {
      return res.status(204).send('')
    }

    return next()
  })
}

loadLocalEnvFile()

const app = express()

configureCors(app)
app.use(express.json())

app.use('/games', gamesRoutes)
app.use('/api/games', gamesRoutes)

app.get('/health', (_, res) => {
  res.json({ status: 'ok' })
})

export const api = functions.https.onRequest(app)

if (process.env.PORT) {
  const port = Number(process.env.PORT)
  app.listen(port, () => {
    console.log(`Server started on port ${port}`)
  })
}
