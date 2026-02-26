"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getGameById } from "@/services/api";
import { Game } from "@/types/game";

export default function GamePage() {
  const { code } = useParams();
  const [game, setGame] = useState<Game | null>(null);

  useEffect(() => {
    async function loadGame() {
      const data = await getGameById(code as string);
      setGame(data);
    }
    loadGame();
  }, [code]);

  if (!game) return <div className="p-10">Carregando...</div>;

  return (
    <main className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-2xl font-bold">{game.theme}</h1>
      <p>Código da sala: {game.gameCode}</p>
      <p>Rodada atual: {game.currentRound}</p>
      <p>Status: {game.status}</p>
    </main>
  );
}