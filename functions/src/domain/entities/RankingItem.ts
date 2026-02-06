export type RankingItem = {
  position: number; // 1 (melhor) até 100 (pior)
  label: string; // Nome canônico
  aliases?: string[]; // Variações aceitas
};
