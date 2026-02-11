export class InvalidGameStateError extends Error {
  constructor(message?: string) {
    super(message ?? 'Invalid game state')
    this.name = 'InvalidGameStateError'
  }
}
