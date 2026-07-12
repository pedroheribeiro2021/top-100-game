"use client";

import { CreateGameError, ThemeSummary, createGame, getThemes } from "@/services/api";
import { useEffect, useMemo, useState } from "react";
import OnboardingOverlay from "@/components/OnboardingOverlay";
import RetroButton from "@/components/RetroButton";
import RetroCard from "@/components/RetroCard";

const ROUND_OPTIONS = [3, 5, 7, 10] as const;
const TIME_OPTIONS = [15, 30, 45, 60] as const;

export default function Home() {
  const [themes, setThemes] = useState<ThemeSummary[]>([]);
  const [query, setQuery] = useState("");
  const [hostName, setHostName] = useState("");
  const [maxRounds, setMaxRounds] = useState<number>(5);
  const [roundTimeLimit, setRoundTimeLimit] = useState<number>(30);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<ThemeSummary[]>([]);

  useEffect(() => {
    getThemes()
      .then(setThemes)
      .catch(() => setThemes([]));
  }, []);

  const filteredThemes = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return themes;

    return themes.filter((theme) =>
      theme.title.toLowerCase().includes(normalized),
    );
  }, [themes, query]);

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
      window.location.href = `/game/${game.id}`;
    } catch (error: unknown) {
      if (error instanceof CreateGameError && error.suggestions) {
        setSuggestions(error.suggestions);
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
                value={roundTimeLimit}
                onChange={(e) => setRoundTimeLimit(Number(e.target.value))}
                className="mt-1 w-full border-2 border-gray-900 p-2 font-mono text-sm text-gray-900"
              >
                {TIME_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}s
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div>
            <label className="text-xs font-bold tracking-wide text-gray-600 uppercase">
              Tema
            </label>
            <input
              type="text"
              placeholder="Buscar tema (ex: cidades, filmes...)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="mt-1 w-full border-2 border-gray-900 p-2 font-mono"
            />
          </div>

          <ul className="max-h-40 space-y-1 overflow-y-auto">
            {filteredThemes.map((theme) => (
              <li key={theme.id}>
                <button
                  onClick={() => handleCreate({ themeId: theme.id })}
                  disabled={loading}
                  className="w-full border-2 border-gray-300 p-2 text-left text-sm hover:border-retro-cyan-dark hover:bg-cyan-50"
                >
                  {theme.title}
                  <span className="ml-2 text-xs text-gray-400">{theme.category}</span>
                </button>
              </li>
            ))}

            {filteredThemes.length === 0 && (
              <li className="text-sm text-gray-400">Nenhum tema encontrado no banco.</li>
            )}
          </ul>

          {suggestions.length > 0 && (
            <div className="border-2 border-retro-yellow-dark bg-yellow-50 p-2 text-sm">
              <p className="mb-1 font-bold text-retro-yellow-dark">
                Tema não encontrado. Que tal:
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
