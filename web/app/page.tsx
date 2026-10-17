"use client";

import { CreateGameError, ThemeSummary, createGame, getThemes } from "@/services/api";
import { useEffect, useMemo, useState } from "react";
import OnboardingOverlay from "@/components/OnboardingOverlay";
import RetroButton from "@/components/RetroButton";
import RetroCard from "@/components/RetroCard";

const ROUND_OPTIONS = [3, 5, 7, 10] as const;
const TIME_PRESETS = [15, 30, 45, 60] as const;
const CUSTOM_TIME_VALUE = "custom";
const TIME_MIN_SECONDS = 10;
const TIME_MAX_SECONDS = 600;

const CATEGORY_LABELS: Record<string, string> = {
  geografia: "Geografia",
  cinema: "Cinema",
  musica: "Música",
  esporte: "Esporte",
  negocios: "Negócios",
  natureza: "Natureza",
  gastronomia: "Gastronomia",
  tv: "TV e séries",
  games: "Games",
  anime: "Anime",
  "cultura-pop": "Cultura pop",
  veiculos: "Veículos",
  tecnologia: "Tecnologia",
  historia: "História",
  ciencia: "Ciência",
  literatura: "Literatura",
  cotidiano: "Cotidiano",
};

const CATEGORY_ICONS: Record<string, string> = {
  geografia: "🌍",
  cinema: "🎬",
  musica: "🎵",
  esporte: "⚽",
  negocios: "💼",
  natureza: "🌿",
  gastronomia: "🍔",
  tv: "📺",
  games: "🎮",
  anime: "🍥",
  "cultura-pop": "⭐",
  veiculos: "🚗",
  tecnologia: "💻",
  historia: "🏛️",
  ciencia: "🔬",
  literatura: "📚",
  cotidiano: "🏠",
};

// Blocos de categoria alternam as cores de destaque (docs/DESIGN.md).
const CATEGORY_TILE_CLASSES = [
  "border-retro-cyan-dark bg-retro-cyan text-gray-900",
  "border-retro-yellow-dark bg-retro-yellow text-gray-900",
  "border-retro-pink-dark bg-retro-pink text-white",
];

// Linha de tema clicável: borda grossa escura + sombra dura curta.
const THEME_ROW_CLASS =
  "w-full border-2 border-gray-900 bg-white p-2 text-left text-sm font-semibold shadow-[3px_3px_0_0_#111827] transition-transform hover:bg-retro-cyan/20 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:cursor-not-allowed disabled:opacity-40";

function normalizeSearch(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

function categoryLabel(category: string): string {
  return (
    CATEGORY_LABELS[category] ??
    category.charAt(0).toUpperCase() + category.slice(1)
  );
}

export default function Home() {
  const [themes, setThemes] = useState<ThemeSummary[]>([]);
  const [query, setQuery] = useState("");
  const [hostName, setHostName] = useState("");
  const [maxRounds, setMaxRounds] = useState<number>(5);
  const [roundTimeLimit, setRoundTimeLimit] = useState<number>(30);
  const [isCustomTime, setIsCustomTime] = useState(false);
  const [customTimeValue, setCustomTimeValue] = useState<string>("30");
  const [customTimeUnit, setCustomTimeUnit] = useState<"s" | "min">("s");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<ThemeSummary[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  function applyCustomTime(value: string, unit: "s" | "min") {
    const parsed = Number(value);
    if (!value || Number.isNaN(parsed)) return;

    const seconds = Math.round(unit === "min" ? parsed * 60 : parsed);
    const clamped = Math.min(
      TIME_MAX_SECONDS,
      Math.max(TIME_MIN_SECONDS, seconds),
    );
    setRoundTimeLimit(clamped);
  }

  useEffect(() => {
    getThemes()
      .then(setThemes)
      .catch(() => setThemes([]));
  }, []);

  const filteredThemes = useMemo(() => {
    const words = normalizeSearch(query).split(/\s+/).filter(Boolean);
    if (words.length === 0) return themes;

    return themes.filter((theme) => {
      const haystack = normalizeSearch(
        `${theme.title} ${categoryLabel(theme.category)}`,
      );
      return words.every((word) => haystack.includes(word));
    });
  }, [themes, query]);

  const categories = useMemo(() => {
    const unique = new Set(themes.map((theme) => theme.category));
    return Array.from(unique).sort();
  }, [themes]);

  const themesInCategory = useMemo(() => {
    if (!selectedCategory) return [];
    return themes.filter((theme) => theme.category === selectedCategory);
  }, [themes, selectedCategory]);

  async function handleCreate(params: {
    theme?: string;
    themeId?: string;
    random?: boolean;
  }) {
    if (!hostName.trim()) return alert("Digite seu nome");

    try {
      setLoading(true);
      setSuggestions([]);
      const game = await createGame({
        ...params,
        hostName,
        maxRounds,
        roundTimeLimit,
      });
      localStorage.setItem("playerId", game.hostId);
      window.location.href = `/game/${game.gameCode}`;
    } catch (error: unknown) {
      // Tema sem correspondência: mostra as sugestões na tela em vez de um alerta.
      if (error instanceof CreateGameError && error.suggestions?.length) {
        setSuggestions(error.suggestions);
        return;
      }

      const message =
        error instanceof Error ? error.message : "Erro ao criar jogo";
      alert(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <OnboardingOverlay />

      <div className="w-full max-w-md space-y-5">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-widest text-retro-yellow drop-shadow-[2px_2px_0_rgba(0,0,0,0.5)]">
            TOP 100
          </h1>
          <p className="mt-1 text-sm tracking-wide text-white">
            O jogo de rankings ocultos
          </p>
        </div>

        <RetroCard color="pink" className="space-y-4">
          <div>
            <label className="text-xs font-bold tracking-wide text-gray-600 uppercase">
              Seu nome
            </label>
            <input
              type="text"
              placeholder="Como te chamamos?"
              value={hostName}
              onChange={(e) => setHostName(e.target.value)}
              className="mt-1 w-full border-2 border-gray-900 p-2 font-mono"
            />
          </div>

          <div className="flex gap-3">
            <label className="flex-1 text-xs font-bold tracking-wide text-gray-600 uppercase">
              Rodadas
              <select
                value={maxRounds}
                onChange={(e) => setMaxRounds(Number(e.target.value))}
                className="mt-1 w-full border-2 border-gray-900 p-2 font-mono text-sm text-gray-900"
              >
                {ROUND_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex-1 text-xs font-bold tracking-wide text-gray-600 uppercase">
              Tempo
              <select
                value={isCustomTime ? CUSTOM_TIME_VALUE : roundTimeLimit}
                onChange={(e) => {
                  if (e.target.value === CUSTOM_TIME_VALUE) {
                    setIsCustomTime(true);
                    applyCustomTime(customTimeValue, customTimeUnit);
                    return;
                  }
                  setIsCustomTime(false);
                  setRoundTimeLimit(Number(e.target.value));
                }}
                className="mt-1 w-full border-2 border-gray-900 p-2 font-mono text-sm text-gray-900"
              >
                {TIME_PRESETS.map((option) => (
                  <option key={option} value={option}>
                    {option}s
                  </option>
                ))}
                <option value={CUSTOM_TIME_VALUE}>Personalizado</option>
              </select>
            </label>
          </div>

          {isCustomTime && (
            <div className="flex items-end gap-2">
              <label className="flex-1 text-xs font-bold tracking-wide text-gray-600 uppercase">
                Tempo personalizado
                <input
                  type="number"
                  min={1}
                  inputMode="numeric"
                  value={customTimeValue}
                  onChange={(e) => {
                    setCustomTimeValue(e.target.value);
                    applyCustomTime(e.target.value, customTimeUnit);
                  }}
                  className="mt-1 w-full border-2 border-gray-900 p-2 font-mono text-sm text-gray-900"
                />
              </label>

              <select
                value={customTimeUnit}
                onChange={(e) => {
                  const unit = e.target.value as "s" | "min";
                  setCustomTimeUnit(unit);
                  applyCustomTime(customTimeValue, unit);
                }}
                className="border-2 border-gray-900 p-2 font-mono text-sm text-gray-900"
              >
                <option value="s">segundos</option>
                <option value="min">minutos</option>
              </select>
            </div>
          )}

          {isCustomTime && (
            <p className="text-right text-xs text-gray-500">
              Tempo por rodada: {roundTimeLimit}s
            </p>
          )}

          <div>
            <label className="text-xs font-bold tracking-wide text-gray-600 uppercase">
              Tema
            </label>
            <input
              type="text"
              placeholder="Ou peça qualquer tema à IA (ex: vilões da Marvel)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="mt-1 w-full border-2 border-gray-900 p-2 font-mono"
            />
          </div>

          {query.trim() ? (
            <ul className="max-h-48 space-y-2 overflow-y-auto pr-1 pb-1">
              {filteredThemes.map((theme) => (
                <li key={theme.id}>
                  <button
                    onClick={() => handleCreate({ themeId: theme.id })}
                    disabled={loading}
                    className={THEME_ROW_CLASS}
                  >
                    {theme.title}
                    <span className="ml-2 text-xs font-normal tracking-wide text-gray-500 uppercase">
                      {CATEGORY_ICONS[theme.category] ?? "🎲"} {categoryLabel(theme.category)}
                    </span>
                  </button>
                </li>
              ))}

              {filteredThemes.length === 0 && (
                <li className="text-sm text-gray-400">Nenhum tema pronto com esse nome — crie a sala e a IA gera o ranking.</li>
              )}
            </ul>
          ) : selectedCategory === null ? (
            <div className="grid grid-cols-2 gap-3 pr-1 pb-1">
              {categories.map((category, index) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`flex items-center gap-2 border-[3px] p-2 text-left text-xs font-bold tracking-wide uppercase shadow-[3px_3px_0_0_#111827] transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${CATEGORY_TILE_CLASSES[index % CATEGORY_TILE_CLASSES.length]}`}
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center border-2 border-gray-900 bg-white text-base">
                    {CATEGORY_ICONS[category] ?? "🎲"}
                  </span>
                  <span className="leading-tight">{categoryLabel(category)}</span>
                </button>
              ))}

              {categories.length === 0 && (
                <p className="col-span-2 text-sm text-gray-400">Nenhuma categoria encontrada no banco.</p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className="text-xs font-bold tracking-wide text-gray-500 uppercase hover:text-retro-pink"
                >
                  ← voltar às categorias
                </button>
                <span className="text-xs font-bold tracking-wide text-gray-900 uppercase">
                  {CATEGORY_ICONS[selectedCategory] ?? "🎲"} {categoryLabel(selectedCategory)}
                </span>
              </div>

              <ul className="max-h-48 space-y-2 overflow-y-auto pr-1 pb-1">
                {themesInCategory.map((theme) => (
                  <li key={theme.id}>
                    <button
                      onClick={() => handleCreate({ themeId: theme.id })}
                      disabled={loading}
                      className={THEME_ROW_CLASS}
                    >
                      {theme.title}
                    </button>
                  </li>
                ))}

                {themesInCategory.length === 0 && (
                  <li className="text-sm text-gray-400">Nenhum tema encontrado nessa categoria.</li>
                )}
              </ul>
            </div>
          )}

          {suggestions.length > 0 && (
            <div className="border-2 border-retro-yellow-dark bg-yellow-50 p-2 text-sm">
              <p className="mb-1 font-bold text-retro-yellow-dark">
                Não achamos esse tema exato. Que tal:
              </p>
              <ul className="space-y-1">
                {suggestions.map((theme) => (
                  <li key={theme.id}>
                    <button
                      onClick={() => handleCreate({ themeId: theme.id })}
                      className="underline hover:text-retro-yellow-dark"
                    >
                      {theme.title}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <RetroButton
            variant="primary"
            onClick={() => handleCreate({ theme: query })}
            disabled={loading || !query.trim() || !hostName.trim()}
            className="w-full"
          >
            {loading ? "Criando..." : "Criar sala com esse tema"}
          </RetroButton>

          <RetroButton
            variant="secondary"
            onClick={() => handleCreate({ random: true })}
            disabled={loading || !hostName.trim()}
            className="w-full"
          >
            Tema aleatório
          </RetroButton>
        </RetroCard>

        <p className="text-center text-xs text-white/80">
          Depois de criar, compartilhe o link da sala com os outros jogadores.
        </p>
      </div>
    </main>
  );
}
