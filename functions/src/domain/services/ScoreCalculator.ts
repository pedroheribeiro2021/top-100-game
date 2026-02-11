import { Score } from '../valueObjects/Score';
import { ScoringMode } from '../entities/Game';

export class ScoreCalculator {
  /**
   * Converte a posição (1–100) em pontos.
   */
  static fromPosition(
    position: number,
    mode: ScoringMode,
    maxPosition = 100,
  ): Score {
    if (position < 1 || position > maxPosition) {
      throw new Error('Invalid ranking position');
    }

    let points: number;

    if (mode === ScoringMode.HIGH_SCORE_WINS) {
      // posição 1 → 100 pontos
      // posição 100 → 1 ponto
      points = maxPosition - position + 1;
    } else {
      // LOW_SCORE_WINS
      // posição 1 → 1 ponto
      // posição 100 → 100 pontos
      points = position;
    }

    return new Score(points);
  }
}
