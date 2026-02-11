import { Game } from '../entities/Game'
import { GameId } from '../valueObjects/GameId'

export interface GameRepository {
  save(game: Game): Promise<void>
  findById(id: GameId): Promise<Game | null>
  listTop(limit: number): Promise<Game[]>
}
