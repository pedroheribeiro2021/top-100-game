import { CreateGameUseCase } from '../../../domain/game/useCases/CreateGameUseCase';
import { GetGameByIdUseCase } from '../../../domain/game/useCases/GetGameByIdUseCase';
import { GameRepository } from '../../../domain/game/repositories/GameRepository';
import { CreateGameDTO } from '../../dtos/CreateGameDTO';
import { GameResponseDTO } from '../../dtos/GameResponseDTO';

export class GameFacade {
  private readonly createGameUseCase: CreateGameUseCase;
  private readonly getGameByIdUseCase: GetGameByIdUseCase;

  constructor(private readonly gameRepository: GameRepository) {
    this.createGameUseCase = new CreateGameUseCase(gameRepository);
    this.getGameByIdUseCase = new GetGameByIdUseCase(gameRepository);
  }

  async createGame(input: CreateGameDTO): Promise<GameResponseDTO> {
    const game = await this.createGameUseCase.execute(input);

    return {
      id: game.id.toString(),
      title: game.title,
      description: game.description,
      createdAt: game.createdAt,
    };
  }

  async getGameById(id: string): Promise<GameResponseDTO> {
    const game = await this.getGameByIdUseCase.execute(id);

    return {
      id: game.id.toString(),
      title: game.title,
      description: game.description,
      createdAt: game.createdAt,
    };
  }
}
