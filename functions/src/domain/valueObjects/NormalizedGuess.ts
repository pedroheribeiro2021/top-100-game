export class NormalizedGuess {
  private readonly value: string;

  constructor(value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('NormalizedGuess cannot be empty');
    }

    this.value = value;
  }

  public getValue(): string {
    return this.value;
  }
}
