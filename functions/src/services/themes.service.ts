import fs from 'fs';
import path from 'path';
import { normalizeText } from '../utils/normalize';

export type ThemeIndexEntry = {
  id: string;
  title: string;
  category: string;
  file: string;
};

export type ThemeItem = {
  position: number;
  value: string;
  aliases?: string[];
};

export type ThemeBank = {
  id: string;
  title: string;
  category: string;
  accuracy?: string;
  updatedAt?: string;
  items: ThemeItem[];
};

export type ThemeSummary = Pick<ThemeIndexEntry, 'id' | 'title' | 'category'>;

export type ThemeMatchResult =
  | { matched: true; theme: ThemeBank }
  | { matched: false; suggestions: ThemeSummary[] };

// Aceita um match sem o usuário precisar digitar o título inteiro,
// mas evita casar temas sem relação nenhuma com a busca.
const MATCH_SCORE_THRESHOLD = 0.55;
const SUGGESTION_LIMIT = 3;

let cachedIndex: ThemeIndexEntry[] | null = null;
const themeCache = new Map<string, ThemeBank>();

function resolveThemesDir(): string {
  const candidates = [
    path.resolve(__dirname, '../data/themes'),
    path.resolve(__dirname, '../../../data/themes'),
  ];

  const found = candidates.find((candidate) =>
    fs.existsSync(path.join(candidate, 'index.json')),
  );

  if (!found) {
    throw new Error('THEME_BANK_NOT_FOUND');
  }

  return found;
}

function loadIndex(): ThemeIndexEntry[] {
  if (cachedIndex) return cachedIndex;

  const themesDir = resolveThemesDir();
  const raw = fs.readFileSync(path.join(themesDir, 'index.json'), 'utf-8');
  cachedIndex = JSON.parse(raw) as ThemeIndexEntry[];

  return cachedIndex;
}

function loadThemeFile(entry: ThemeIndexEntry): ThemeBank {
  const cached = themeCache.get(entry.id);
  if (cached) return cached;

  const themesDir = resolveThemesDir();
  const raw = fs.readFileSync(path.join(themesDir, entry.file), 'utf-8');
  const theme = JSON.parse(raw) as ThemeBank;

  themeCache.set(entry.id, theme);
  return theme;
}

function levenshteinDistance(a: string, b: string): number {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const distances: number[][] = Array.from({ length: rows }, () =>
    new Array<number>(cols).fill(0),
  );

  for (let i = 0; i < rows; i++) distances[i][0] = i;
  for (let j = 0; j < cols; j++) distances[0][j] = j;

  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      distances[i][j] = Math.min(
        distances[i - 1][j] + 1,
        distances[i][j - 1] + 1,
        distances[i - 1][j - 1] + cost,
      );
    }
  }

  return distances[rows - 1][cols - 1];
}

function similarityScore(normalizedQuery: string, normalizedTitle: string): number {
  if (!normalizedQuery || !normalizedTitle) return 0;
  if (normalizedQuery === normalizedTitle) return 1;
  if (normalizedTitle.includes(normalizedQuery) || normalizedQuery.includes(normalizedTitle)) {
    return 0.9;
  }

  const distance = levenshteinDistance(normalizedQuery, normalizedTitle);
  const maxLength = Math.max(normalizedQuery.length, normalizedTitle.length) || 1;

  return 1 - distance / maxLength;
}

export function listThemes(): ThemeSummary[] {
  return loadIndex().map(({ id, title, category }) => ({ id, title, category }));
}

export function getThemeById(themeId: string): ThemeBank | null {
  const entry = loadIndex().find((item) => item.id === themeId);
  if (!entry) return null;

  return loadThemeFile(entry);
}

export function getRandomTheme(): ThemeBank {
  const index = loadIndex();
  const entry = index[Math.floor(Math.random() * index.length)];

  return loadThemeFile(entry);
}

export function resolveThemeByQuery(query: string): ThemeMatchResult {
  const index = loadIndex();
  const normalizedQuery = normalizeText(query);

  const scored = index
    .map((entry) => ({
      entry,
      score: similarityScore(normalizedQuery, normalizeText(entry.title)),
    }))
    .sort((a, b) => b.score - a.score);

  const best = scored[0];
  if (best && best.score >= MATCH_SCORE_THRESHOLD) {
    return { matched: true, theme: loadThemeFile(best.entry) };
  }

  return {
    matched: false,
    suggestions: scored
      .slice(0, SUGGESTION_LIMIT)
      .map(({ entry }) => ({ id: entry.id, title: entry.title, category: entry.category })),
  };
}
