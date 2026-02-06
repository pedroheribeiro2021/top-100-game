import { buildServer } from './app/server'

const app = buildServer()

// ⚠️ APENAS para desenvolvimento local
if (process.env.NODE_ENV !== 'production') {
  app.listen({ port: 3000 }, (err, address) => {
    if (err) {
      app.log.error(err)
      process.exit(1)
    }
    app.log.info(`🚀 Server running at ${address}`)
  })
}

// Firebase adapter entra na próxima etapa
export default app
