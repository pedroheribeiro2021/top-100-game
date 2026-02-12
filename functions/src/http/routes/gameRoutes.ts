import { FastifyInstance } from 'fastify';
import { GameController } from '../controllers/GameController';

export async function gameRoutes(
  fastify: FastifyInstance,
  controller: GameController,
) {
  fastify.post('/games', controller.create.bind(controller));
  fastify.get('/games/:id', controller.getById.bind(controller));
}
