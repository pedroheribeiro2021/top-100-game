export class Score {
  private readonly value: number;

  constructor(value: number) {
    if (value < 0) {
      throw new Error('Score cannot be negative');
    }

    this.value = value;
  }

  public getValue(): number {
    return this.value;
  }

  public add(score: Score): Score {
    return new Score(this.value + score.getValue());
  }
}
