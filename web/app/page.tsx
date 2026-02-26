"use client";

import { createGame } from "@/services/api";
import { useState } from "react";

export default function Home() {
  const [theme, setTheme] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    try {
      setLoading(true);
      const game = await createGame(theme);
      window.location.href = `/game/${game.id}`;
    } catch (error) {
      alert("Erro ao criar jogo");
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
          placeholder="Tema (ex: Top 100 músicas)"
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          className="w-full p-2 rounded bg-gray-700"
        />

        <button
          onClick={handleCreate}
          disabled={loading}
          className="w-full bg-blue-600 p-2 rounded hover:bg-blue-500"
        >
          {loading ? "Criando..." : "Criar Sala"}
        </button>
      </div>
    </main>
  );
}