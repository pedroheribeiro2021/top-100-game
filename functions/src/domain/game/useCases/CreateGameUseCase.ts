import { Game } from '../entities/Game';
import { GameRepository } from '../repositories/GameRepository';

type CreateGameInput = {
  title: string;
  description?: string;
};

export class CreateGameUseCase {
  constructor(private readonly gameRepository: GameRepository) {}

  async execute(input: CreateGameInput): Promise<Game> {
    const game = Game.create({
      title: input.title,
      description: input.description,
    });

    await this.gameRepository.save(game);

    return game;
  }
}
