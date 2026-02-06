import Fastify from 'fastify';

export function buildServer() {
  const app = Fastify({
    logger: true,
  });

  // Rotas básicas (por enquanto)
  app.get('/health', async () => {
    return { status: 'ok' };
  });

  return app;
}
