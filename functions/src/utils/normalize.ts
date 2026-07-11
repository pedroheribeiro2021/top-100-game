/**
 * Normalização de texto usada no matching de temas e itens (DOMAIN §4):
 * caixa baixa, sem acentos, trim, espaços colapsados.
 */
export function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}
