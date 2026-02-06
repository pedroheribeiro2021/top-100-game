import { NormalizedGuess } from '../valueObjects/NormalizedGuess'

export class GuessNormalizer {
  static normalize(rawInput: string): NormalizedGuess {
    const normalized = rawInput
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // remove acentos
      .replace(/[^a-z0-9\s]/g, '')     // remove símbolos
      .replace(/\s+/g, ' ')            // espaços duplicados
      .trim()

    return new NormalizedGuess(normalized)
  }
}
