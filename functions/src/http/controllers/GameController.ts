import { FastifyReply, FastifyRequest } from 'fastify';
import { GameFacade } from '../../application/facades/GameFacade';

export class GameController {
  constructor(private readonly gameFacade: GameFacade) {}

  async create(request: FastifyRequest, reply: FastifyReply) {
    const { title, description } = request.body as {
      title: string;
      description?: string;
    };

    const game = await this.gameFacade.createGame({
      title,
      description,
    });

    return reply.status(201).send(game);
  }

  async getById(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };

    const game = await this.gameFacade.getGameById(id);

    return reply.status(200).send(game);
  }
}
