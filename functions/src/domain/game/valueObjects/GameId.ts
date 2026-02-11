import { randomUUID } from 'crypto'

export class GameId {
  private constructor(private readonly value: string) {}

  static generate(): GameId {
    return new GameId(randomUUID())
  }

  static fromString(value: string): GameId {
    if (!value || value.trim().length === 0) {
      throw new Error('Invalid GameId')
    }

    return new GameId(value)
  }

  toString(): string {
    return this.value
  }

  equals(other: GameId): boolean {
    return this.value === other.value
  }
}
