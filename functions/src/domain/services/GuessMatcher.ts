import { RankingItem } from '../entities/RankingItem';
import { NormalizedGuess } from '../valueObjects/NormalizedGuess';

export type MatchResult =
  | { type: 'exact'; item: RankingItem }
  | { type: 'alias'; item: RankingItem }
  | { type: 'fuzzy'; item: RankingItem; confidence: number }
  | { type: 'subjective'; candidates: RankingItem[] }
  | { type: 'not_found' };

export class GuessMatcher {
  static match(guess: NormalizedGuess, ranking: RankingItem[]): MatchResult {
    const value = guess.getValue();

    // 1️⃣ Match exato
    const exact = ranking.find((item) => item.label.toLowerCase() === value);
    if (exact) {
      return { type: 'exact', item: exact };
    }

    // 2️⃣ Match por alias
    const alias = ranking.find((item) =>
      item.aliases?.some((a) => a.toLowerCase() === value),
    );
    if (alias) {
      return { type: 'alias', item: alias };
    }

    // 3️⃣ Subjetivo (termo genérico)
    const subjectiveMatches = ranking.filter((item) =>
      item.label.toLowerCase().includes(value),
    );
    if (subjectiveMatches.length > 1) {
      return {
        type: 'subjective',
        candidates: subjectiveMatches,
      };
    }

    // 4️⃣ Fuzzy match (fallback simples)
    const fuzzy = this.findBestFuzzyMatch(value, ranking);
    if (fuzzy) {
      return {
        type: 'fuzzy',
        item: fuzzy.item,
        confidence: fuzzy.confidence,
      };
    }

    // 5️⃣ Nada encontrado
    return { type: 'not_found' };
  }

  private static findBestFuzzyMatch(
    value: string,
    ranking: RankingItem[],
  ): { item: RankingItem; confidence: number } | null {
    let bestMatch: RankingItem | null = null;
    let bestScore = 0;

    for (const item of ranking) {
      const score = this.similarity(value, item.label.toLowerCase());
      if (score > bestScore && score >= 0.8) {
        bestScore = score;
        bestMatch = item;
      }
    }

    if (!bestMatch) return null;

    return { item: bestMatch, confidence: bestScore };
  }

  // Similaridade simples (Levenshtein normalizado)
  private static similarity(a: string, b: string): number {
    const distance = this.levenshtein(a, b);
    const maxLen = Math.max(a.length, b.length);
    return maxLen === 0 ? 1 : 1 - distance / maxLen;
  }

  private static levenshtein(a: string, b: string): number {
    const matrix = Array.from({ length: a.length + 1 }, () =>
      Array(b.length + 1).fill(0),
    );

    for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
    for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost,
        );
      }
    }

    return matrix[a.length][b.length];
  }
}
