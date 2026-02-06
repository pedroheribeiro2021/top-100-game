import functions from 'firebase-functions'
import { buildServer } from './server'

export const api = functions.https.onRequest((req, res) => {
  const fastify = buildServer()

  fastify.ready(err => {
    if (err) {
      res.status(500).send(err)
      return
    }

    fastify.server.emit('request', req, res)
  })
})
