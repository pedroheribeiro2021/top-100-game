import { normalizeText } from '../utils/normalize';

/**
 * DOMAIN §4: minúsculas, sem acentos, trim, espaços colapsados,
 * e sem pontuação nas bordas do palpite.
 */
const BORDER_PUNCTUATION = /^[.,;:!?'"()-]+|[.,;:!?'"()-]+$/g;

export function normalize(text: string): string {
  return normalizeText(text).replace(BORDER_PUNCTUATION, '').trim();
}

export type MatchableRankingItem = {
  position: number;
  value: string;
  aliases?: string[];
};

export function findRankingItem<T extends MatchableRankingItem>(
  ranking: T[],
  answer: string,
): T | null {
  const target = normalize(answer);
  if (!target) return null;

  return (
    ranking.find((item) => {
      if (normalize(item.value) === target) return true;
      return (item.aliases || []).some((alias) => normalize(alias) === target);
    }) ?? null
  );
}
