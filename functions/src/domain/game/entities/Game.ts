import { GameId } from '../valueObjects/GameId'

type GameProps = {
  id: GameId
  title: string
  description?: string
  createdAt: Date
}

type CreateGameProps = {
  title: string
  description?: string
}

export class Game {
  private constructor(private readonly props: GameProps) {}

  static create(input: CreateGameProps): Game {
    if (!input.title || input.title.trim().length < 3) {
      throw new Error('Game title must have at least 3 characters')
    }

    const game = new Game({
      id: GameId.generate(),
      title: input.title.trim(),
      description: input.description?.trim(),
      createdAt: new Date(),
    })

    return game
  }

  get id(): GameId {
    return this.props.id
  }

  get title(): string {
    return this.props.title
  }

  get description(): string | undefined {
    return this.props.description
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  toJSON() {
    return {
      id: this.id.toString(),
      title: this.title,
      description: this.description,
      createdAt: this.createdAt,
    }
  }
}
