export class GameNotFoundError extends Error {
  constructor(id?: string) {
    super(id ? `Game with id ${id} not found` : 'Game not found');
    this.name = 'GameNotFoundError';
  }
}
