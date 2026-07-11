"use client";

import { CreateGameError, ThemeSummary, createGame, getThemes } from "@/services/api";
import { useEffect, useMemo, useState } from "react";

export default function Home() {
  const [themes, setThemes] = useState<ThemeSummary[]>([]);
  const [query, setQuery] = useState("");
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
    try {
      setLoading(true);
      setSuggestions([]);
      const game = await createGame(params);
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
    <main className="flex min-h-screen items-center justify-center bg-gray-900 text-white">
      <div className="bg-gray-800 p-8 rounded-xl w-96 space-y-4">
        <h1 className="text-2xl font-bold text-center">Top 100 Game</h1>

        <input
          type="text"
          placeholder="Buscar tema (ex: cidades, filmes...)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full p-2 rounded bg-gray-700"
        />

        <ul className="max-h-48 space-y-1 overflow-y-auto">
          {filteredThemes.map((theme) => (
            <li key={theme.id}>
              <button
                onClick={() => handleCreate({ themeId: theme.id })}
                disabled={loading}
                className="w-full rounded bg-gray-700 p-2 text-left hover:bg-gray-600"
              >
                {theme.title}
                <span className="ml-2 text-xs text-gray-400">
                  {theme.category}
                </span>
              </button>
            </li>
          ))}

          {filteredThemes.length === 0 && (
            <li className="text-sm text-gray-400">
              Nenhum tema encontrado no banco.
            </li>
          )}
        </ul>

        {suggestions.length > 0 && (
          <div className="rounded border border-yellow-700 bg-yellow-950/40 p-2 text-sm">
            <p className="mb-1 text-yellow-300">Tema não encontrado. Que tal:</p>
            <ul className="space-y-1">
              {suggestions.map((theme) => (
                <li key={theme.id}>
                  <button
                    onClick={() => handleCreate({ themeId: theme.id })}
                    className="underline hover:text-yellow-200"
                  >
                    {theme.title}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <button
          onClick={() => handleCreate({ theme: query })}
          disabled={loading || !query.trim()}
          className="w-full bg-blue-600 p-2 rounded hover:bg-blue-500"
        >
          {loading ? "Criando..." : "Criar sala com esse tema"}
        </button>

        <button
          onClick={() => handleCreate({ random: true })}
          disabled={loading}
          className="w-full bg-purple-600 p-2 rounded hover:bg-purple-500"
        >
          Tema aleatório
        </button>
      </div>
    </main>
  );
}
