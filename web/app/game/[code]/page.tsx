"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getGameById, joinGame, startGame } from "@/services/api";
import { Game, Player } from "@/types/game";

export default function GamePage() {
  const { code } = useParams();
  const [game, setGame] = useState<Game | null>(null);
  const [playerName, setPlayerName] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadGame() {
    const data = await getGameById(code as string);
    setGame(data);
  }

  useEffect(() => {
    loadGame();

    // polling simples a cada 3 segundos
    const interval = setInterval(loadGame, 3000);
    return () => clearInterval(interval);
  }, [code]);

  async function handleJoin() {
    if (!playerName) return alert("Digite seu nome");

    try {
      setLoading(true);
      await joinGame(game!.gameCode, playerName);
      setPlayerName("");
      await loadGame();
    } catch (error) {
      alert("Erro ao entrar na sala");
    } finally {
      setLoading(false);
    }
  }

  async function handleStart() {
    try {
      await startGame(game!.id);
      await loadGame();
    } catch (error) {
      alert("Erro ao iniciar jogo");
    }
  }

  if (!game) return <div className="p-10">Carregando...</div>;

  return (
    <main className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-2xl font-bold mb-4">{game.theme}</h1>

      <p>Código da sala: {game.gameCode}</p>
      <p>Status: {game.status}</p>
      <p>Rodada atual: {game.currentRound}</p>

      {game.status === "RANKING_READY" && (
        <div className="mt-6 space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Seu nome"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="p-2 rounded bg-gray-800"
            />

            <button
              onClick={handleJoin}
              disabled={loading}
              className="bg-blue-600 px-4 rounded"
            >
              Entrar
            </button>
          </div>

          <div>
            <h2 className="font-bold">Jogadores:</h2>
            <ul>
              {game.players.map((player: Player) => (
                <li key={player.id}>
                  {player.name} - {player.score} pts
                </li>
              ))}
            </ul>
          </div>

          {game.players.length > 0 && (
            <button
              onClick={handleStart}
              className="bg-green-600 px-4 py-2 rounded"
            >
              Iniciar Jogo
            </button>
          )}
        </div>
      )}

      {game.status === "IN_PROGRESS" && (
        <div className="mt-6">
          <p>Jogo em andamento...</p>
        </div>
      )}

      {game.status === "FINISHED" && (
        <div className="mt-6">
          <h2 className="text-xl font-bold">Vencedor: {game.winner?.name}</h2>
        </div>
      )}
    </main>
  );
}
