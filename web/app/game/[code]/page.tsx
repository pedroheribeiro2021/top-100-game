"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { advanceRound, getGameById, joinGame, startGame, submitAnswer } from "@/services/api";
import { Game, Player } from "@/types/game";
import { useCurrentPlayer } from "@/hooks/useCurrentPlayer";
import { onSnapshot, doc } from "firebase/firestore";
import { db } from "@/services/firebase";

export default function GamePage() {
  const params = useParams<{ code: string }>();
  const code = params.code;
  const [game, setGame] = useState<Game | null>(null);
  const [playerName, setPlayerName] = useState("");
  const [loading, setLoading] = useState(false);

  const currentPlayer = useCurrentPlayer(game);

  async function loadGame() {
    const data = await getGameById(code as string);
    setGame(data);
  }

  useEffect(() => {
    if (!code) return;

    loadGame();

    const unsubscribe = onSnapshot(doc(db, "games", code), (snapshot) => {
      if (snapshot.exists()) {
        setGame(snapshot.data() as Game);
      }
    });

    return () => unsubscribe();
  }, [code]);

  async function handleJoin() {
    if (!playerName) return alert("Digite seu nome");

    try {
      setLoading(true);
      const player = await joinGame(game!.gameCode, playerName);
      localStorage.setItem("playerId", player.id);
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
                <li
                  key={player.id}
                  className={`${
                    currentPlayer?.id === player.id
                      ? "text-green-400 font-bold"
                      : ""
                  }`}
                >
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

      {game.status === "STARTED" && (
        <RoundSection game={game} reload={loadGame} />
      )}

      {game.status === "FINISHED" && (
        <div className="mt-6">
          <h2 className="text-xl font-bold">Vencedor: {game.winner?.name}</h2>
        </div>
      )}
    </main>
  );
}

function RoundSection({
  game,
  reload,
}: {
  game: Game;
  reload: () => Promise<void>;
}) {
  const [answer, setAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const playerId =
    typeof window !== "undefined" ? localStorage.getItem("playerId") : null;

  async function handleSubmit() {
    if (!answer) return alert("Digite uma resposta");
    if (!playerId) return alert("Você precisa entrar na sala primeiro");

    try {
      setSubmitting(true);
      await submitAnswer(game.id, playerId, answer);
      setAnswer("");
    } catch (error: any) {
      alert(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAdvance() {
    try {
      await advanceRound(game.id); // ✅ AGORA USA A FUNÇÃO CORRETA
      await reload();
    } catch (error) {
      alert("Erro ao avançar rodada");
    }
  }

  return (
    <div className="mt-6 space-y-4">
      <h2 className="font-bold">Rodada {game.currentRound}</h2>

      {game.roundPhase === "ANSWERING" && (
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Sua resposta"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            className="p-2 rounded bg-gray-800"
          />

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-blue-600 px-4 rounded"
          >
            Enviar
          </button>
        </div>
      )}

      {game.roundPhase === "RESULT" && (
        <div className="space-y-3">
          <h3 className="text-yellow-400 font-bold">Resultado da Rodada</h3>

          <ul>
            {game.currentRoundAnswers?.map((a) => {
              const player = game.players.find((p) => p.id === a.playerId);

              return (
                <li key={a.playerId}>
                  {player?.name}: {a.answer} (+{a.points} pts)
                </li>
              );
            })}
          </ul>

          {game.status !== "FINISHED" && (
            <button
              onClick={handleAdvance}
              className="bg-green-600 px-4 py-2 rounded"
            >
              Próxima Rodada
            </button>
          )}
        </div>
      )}

      <div>
        <h3 className="font-bold">Placar:</h3>
        <ul>
          {game.players.map((player) => (
            <li key={player.id}>
              {player.name} - {player.score} pts
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
