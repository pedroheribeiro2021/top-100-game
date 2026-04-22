"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { advanceRound, getGameById, joinGame, startGame, submitAnswer } from "@/services/api";
import { Game, Player, RoundHistoryEntry } from "@/types/game";
import { useCurrentPlayer } from "@/hooks/useCurrentPlayer";
import { onSnapshot, doc } from "firebase/firestore";
import { db } from "@/services/firebase";

const ROUND_TIME_LIMIT_SECONDS = 180;

export default function GamePage() {
  const params = useParams<{ code: string }>();
  const code = params.code;
  const [game, setGame] = useState<Game | null>(null);
  const [playerName, setPlayerName] = useState("");
  const [loading, setLoading] = useState(false);

  const currentPlayer = useCurrentPlayer(game);

  const loadGame = useCallback(async () => {
    const data = await getGameById(code as string);
    setGame(data);
  }, [code]);

  useEffect(() => {
    if (!code) return;

    loadGame();

    const unsubscribe = onSnapshot(doc(db, "games", code), (snapshot) => {
      if (snapshot.exists()) {
        setGame(snapshot.data() as Game);
      }
    });

    return () => unsubscribe();
  }, [code, loadGame]);

  async function handleJoin() {
    if (!playerName) return alert("Digite seu nome");

    try {
      setLoading(true);
      const player = await joinGame(game!.gameCode, playerName);
      localStorage.setItem("playerId", player.id);
      setPlayerName("");
      await loadGame();
    } catch {
      alert("Erro ao entrar na sala");
    } finally {
      setLoading(false);
    }
  }

  async function handleStart() {
    try {
      await startGame(game!.id);
      await loadGame();
    } catch {
      alert("Erro ao iniciar jogo");
    }
  }

  if (!game) return <div className="p-10">Carregando...</div>;

  return (
    <main className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-2xl font-bold mb-4">{game.theme}</h1>

      <p>Código da sala: <span className="font-mono">{game.gameCode}</span></p>
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
        <RoundSection game={game} reload={loadGame} currentPlayer={currentPlayer} />
      )}

      {game.status === "FINISHED" && (
        <FinalResultSection game={game} />
      )}
    </main>
  );
}

function RoundSection({
  game,
  reload,
  currentPlayer,
}: {
  game: Game;
  reload: () => Promise<void>;
  currentPlayer: Player | null;
}) {
  const [answer, setAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const [now, setNow] = useState(Date.now());

  const playerId =
    typeof window !== "undefined" ? localStorage.getItem("playerId") : null;


  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const secondsLeft = useMemo(() => {
    if (!game.roundDeadlineAt) return ROUND_TIME_LIMIT_SECONDS;
    const deadline = new Date(game.roundDeadlineAt).getTime();
    const diff = Math.floor((deadline - now) / 1000);
    return Math.max(diff, 0);
  }, [game.roundDeadlineAt, now]);

  const alreadyAnswered = useMemo(() => {
    if (!playerId) return false;
    return (game.currentRoundAnswers || []).some((a) => a.playerId === playerId);
  }, [game.currentRoundAnswers, playerId]);

  useEffect(() => {
    if (game.status !== "STARTED") return;
    if (game.roundPhase !== "ANSWERING") return;
    if (secondsLeft > 0) return;
    if (advancing) return;

    const timeoutAdvance = async () => {
      try {
        setAdvancing(true);
        await advanceRound(game.id);
        await reload();
      } catch {
        // outro cliente pode ter avançado a rodada antes
      } finally {
        setAdvancing(false);
      }
    };

    timeoutAdvance();
  }, [advancing, game.id, game.roundPhase, game.status, reload, secondsLeft]);

  async function handleSubmit() {
    if (!answer) return alert("Digite uma resposta");
    if (!playerId) return alert("Você precisa entrar na sala primeiro");

    try {
      setSubmitting(true);
      await submitAnswer(game.id, playerId, answer);
      setAnswer("");
      await reload();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Erro ao enviar resposta";
      alert(message);
    } finally {
      setSubmitting(false);
    }
  }

  const playersAnswered = game.currentRoundAnswers?.length || 0;
  const totalPlayers = game.players.length;

  return (
    <div className="mt-6 space-y-4">
      <h2 className="font-bold">Rodada {game.currentRound}</h2>

      <div className="p-3 rounded bg-gray-800">
        <p>
          ⏱️ Tempo restante: <span className="font-bold">{formatSeconds(secondsLeft)}</span>
        </p>
        <p>
          Respostas recebidas: {playersAnswered}/{totalPlayers}
        </p>
      </div>

      {game.roundPhase === "ANSWERING" && (
        <div className="space-y-3">
          {!alreadyAnswered ? (
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
          ) : (
            <p className="text-green-400 font-semibold">
              ✅ Resposta enviada! Aguardando demais jogadores...
            </p>
          )}

          {currentPlayer && (
            <p className="text-sm text-gray-300">
              Jogando como: <span className="font-semibold">{currentPlayer.name}</span>
            </p>
          )}
        </div>
      )}

      <div>
        <h3 className="font-bold">Placar ao vivo:</h3>
        <ul>
          {[...game.players]
            .sort((a, b) => b.score - a.score)
            .map((player) => (
              <li key={player.id}>
                {player.name} - {player.score} pts
              </li>
            ))}
        </ul>
      </div>
    </div>
  );
}

function FinalResultSection({ game }: { game: Game }) {
  const ranking = [...game.players].sort((a, b) => b.score - a.score);
  const winner = game.winner || ranking[0] || null;
  const roundHistory = game.roundHistory || [];

  function handleNewGame() {
    localStorage.removeItem("playerId");
    window.location.href = "/";
  }

  return (
    <div className="mt-6 space-y-6">
      <div className="bg-green-900/40 border border-green-700 rounded p-4">
        <h2 className="text-xl font-bold text-green-300">🏆 Resultado Final</h2>
        {winner ? (
          <p className="mt-2">
            Vencedor: <span className="font-bold">{winner.name}</span> com{" "}
            <span className="font-bold">{winner.score} pontos</span>
          </p>
        ) : (
          <p>Nenhum vencedor definido.</p>
        )}
      </div>

      <div>
        <h3 className="font-bold mb-2">Ranking final</h3>
        <ol className="list-decimal list-inside space-y-1">
          {ranking.map((player) => (
            <li key={player.id}>
              {player.name} - {player.score} pts
            </li>
          ))}
        </ol>
      </div>

      <div>
        <h3 className="font-bold mb-2">Respostas por rodada</h3>

        {roundHistory.length === 0 ? (
          <p className="text-gray-300">Sem histórico de rodadas registrado.</p>
        ) : (
          <div className="space-y-4">
            {roundHistory.map((entry: RoundHistoryEntry) => (
              <div key={entry.round} className="bg-gray-800 rounded p-3">
                <h4 className="font-semibold text-yellow-300 mb-2">
                  Rodada {entry.round}
                </h4>
                <ul className="space-y-1">
                  {entry.answers.map((a) => {
                    const player = game.players.find((p) => p.id === a.playerId);
                    return (
                      <li key={`${entry.round}-${a.playerId}`}>
                        {player?.name || a.playerId}: {a.answer} (+{a.points} pts)
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={handleNewGame}
        className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-500"
      >
        Novo jogo
      </button>
    </div>
  );
}

function formatSeconds(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}
