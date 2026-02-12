/* eslint-disable @typescript-eslint/no-unused-vars */
import { GameRepository } from '../../domain/game/repositories/GameRepository'
import { Game } from '../../domain/game/entities/Game'
import { GameId } from '../../domain/game/valueObjects/GameId'

export class InMemoryGameRepository implements GameRepository {
  listTop(_limit: number): Promise<Game[]> {
    throw new Error('Method not implemented.')
  }
  private games: Map<string, Game> = new Map()

  async save(game: Game): Promise<void> {
    this.games.set(game.id.toString(), game)
  }

  async findById(id: GameId): Promise<Game | null> {
    return this.games.get(id.toString()) ?? null
  }
}
