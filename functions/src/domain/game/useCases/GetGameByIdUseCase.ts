import { GameRepository } from '../repositories/GameRepository';
import { GameId } from '../valueObjects/GameId';
import { GameNotFoundError } from '../errors/GameNotFoundError';
import { Game } from '../entities/Game';

export class GetGameByIdUseCase {
  constructor(private readonly gameRepository: GameRepository) {}

  async execute(id: string): Promise<Game> {
    const gameId = GameId.fromString(id);

    const game = await this.gameRepository.findById(gameId);

    if (!game) {
      throw new GameNotFoundError(id);
    }

    return game;
  }
}
