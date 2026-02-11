import { RankingItem } from '../entities/RankingItem';

export class SubjectiveGuessRule {
  static resolve(candidates: RankingItem[]): RankingItem {
    // Regra oficial:
    // usar o PIOR ranking (menor vantagem possível)
    return candidates.reduce((worst, current) =>
      current.position > worst.position ? current : worst,
    );
  }
}
