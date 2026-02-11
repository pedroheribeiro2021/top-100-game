import { GameRepository } from '../repositories/GameRepository'
import { Game } from '../entities/Game'

export class ListTopGamesUseCase {
  constructor(
    private readonly gameRepository: GameRepository
  ) {}

  async execute(limit = 100): Promise<Game[]> {
    return this.gameRepository.listTop(limit)
  }
}
