import { normalizeText } from '../utils/normalize';

/**
 * DOMAIN §4: minúsculas, sem acentos, trim, espaços colapsados, e pontuação
 * que separa palavras vira espaço ("He-Man" → "he man", "AC/DC" → "ac dc",
 * "Dr. House" → "dr house").
 */
const WORD_SEPARATORS = /[\s\-‐-―_.,;:!?'"`´‘’“”()[\]/\\]+/g;

export function normalize(text: string): string {
  return normalizeText(text).replace(WORD_SEPARATORS, ' ').trim();
}

/**
 * Forma compacta usada na comparação: sem espaço nenhum, para que grafias
 * igualmente válidas casem entre si ("he man" = "he-man" = "heman",
 * "mcdonalds" = "McDonald's"). Só junta as mesmas letras na mesma ordem.
 */
function compact(text: string): string {
  return normalize(text).replace(/ /g, '');
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
  const target = compact(answer);
  if (!target) return null;

  return (
    ranking.find((item) => {
      if (compact(item.value) === target) return true;
      return (item.aliases || []).some((alias) => compact(alias) === target);
    }) ?? null
  );
}
