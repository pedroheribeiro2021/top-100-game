"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  advanceRound,
  getGameById,
  joinGame,
  startGame,
  submitAnswer,
} from "@/services/api";
import { Game, Player, RoundHistoryEntry } from "@/types/game";
import { useCurrentPlayer } from "@/hooks/useCurrentPlayer";

const GAME_POLL_INTERVAL_MS = 2000;

export default function GamePage() {
  const params = useParams<{ code: string }>();
  const code = params.code;
  const [game, setGame] = useState<Game | null>(null);
  const [playerName, setPlayerName] = useState("");
  const [loading, setLoading] = useState(false);

  const currentPlayer = useCurrentPlayer(game);

  const loadGame = useCallback(async () => {
    if (!code) return;

    const data = await getGameById(code as string);
    setGame(data);
  }, [code]);

  useEffect(() => {
    if (!code) return;

    void loadGame();

    const interval = setInterval(() => {
      void loadGame();
    }, GAME_POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [code, loadGame]);

  async function handleJoin() {
    if (!playerName) return alert("Digite seu nome");
    if (!game) return;

    try {
      setLoading(true);
      const player = await joinGame(game.gameCode, playerName);
      localStorage.setItem("playerId", player.id);
      setPlayerName("");
      await loadGame();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Erro ao entrar na sala";
      alert(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleStart() {
    if (!game || !currentPlayer) return;

    try {
      await startGame(game.id, currentPlayer.id);
      await loadGame();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Erro ao iniciar jogo";
      alert(message);
    }
  }

  if (!game) return <div className="p-10">Carregando...</div>;

  const isHost = currentPlayer?.id === game.hostId;

  return (
    <main className="min-h-screen bg-gray-900 p-8 text-white">
      <h1 className="mb-4 text-2xl font-bold">{game.theme}</h1>

      <p>
        Codigo da sala: <span className="font-mono">{game.gameCode}</span>
      </p>
      <p>Status: {game.status}</p>
      <p>Rodada atual: {game.currentRound}</p>

      {game.rankingSource && (
        <div className="mt-4 rounded border border-blue-700 bg-blue-950/40 p-3 text-sm text-blue-200">
          Tema gerado dinamicamente por IA via {game.rankingSource}.
        </div>
      )}

      {game.status === "RANKING_READY" && (
        <div className="mt-6 space-y-4">
          <p className="text-sm text-gray-300">
            {game.maxRounds} rodadas · {game.roundTimeLimit}s por rodada ·{" "}
            {game.players.length}/5 jogadores
          </p>

          {!currentPlayer && (
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Seu nome"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="rounded bg-gray-800 p-2"
              />

              <button
                onClick={handleJoin}
                disabled={loading}
                className="rounded bg-blue-600 px-4"
              >
                Entrar
              </button>
            </div>
          )}

          <div>
            <h2 className="font-bold">Jogadores:</h2>
            <ul>
              {game.players.map((player: Player) => (
                <li
                  key={player.id}
                  className={
                    currentPlayer?.id === player.id
                      ? "font-bold text-green-400"
                      : ""
                  }
                >
                  {player.name}
                  {player.id === game.hostId && " 👑"} - {player.score} pts
                </li>
              ))}
            </ul>
          </div>

          {isHost && (
            <button
              onClick={handleStart}
              disabled={game.players.length < 2}
              className="rounded bg-green-600 px-4 py-2 disabled:opacity-50"
            >
              Iniciar jogo
            </button>
          )}
        </div>
      )}

      {game.status === "STARTED" && (
        <RoundSection
          game={game}
          reload={loadGame}
          currentPlayer={currentPlayer}
        />
      )}

      {game.status === "FINISHED" && <FinalResultSection game={game} />}
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
    const deadline = resolveDeadlineMs(game.roundDeadlineAt);
    if (deadline === null) return null;

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
    if (secondsLeft === null || secondsLeft > 0) return;
    if (advancing) return;

    const timeoutAdvance = async () => {
      try {
        setAdvancing(true);
        await advanceRound(game.id);
        await reload();
      } catch {
        // Outro cliente pode ter avancado a rodada antes.
      } finally {
        setAdvancing(false);
      }
    };

    void timeoutAdvance();
  }, [advancing, game.id, game.roundPhase, game.status, reload, secondsLeft]);

  async function handleSubmit() {
    if (!answer) return alert("Digite uma resposta");
    if (!playerId) return alert("Voce precisa entrar na sala primeiro");

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
      <h2 className="font-bold">
        Rodada {game.currentRound} de {game.maxRounds}
      </h2>

      <div className="rounded bg-gray-800 p-3">
        <p>
          Tempo restante:{" "}
          <span className="font-bold">
            {secondsLeft === null
              ? formatSeconds(game.roundTimeLimit)
              : formatSeconds(secondsLeft)}
          </span>
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
                className="rounded bg-gray-800 p-2"
              />

              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="rounded bg-blue-600 px-4"
              >
                Enviar
              </button>
            </div>
          ) : (
            <p className="font-semibold text-green-400">
              Resposta enviada. Aguardando os demais jogadores...
            </p>
          )}

          {currentPlayer && (
            <p className="text-sm text-gray-300">
              Jogando como:{" "}
              <span className="font-semibold">{currentPlayer.name}</span>
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
      <div className="rounded border border-green-700 bg-green-900/40 p-4">
        <h2 className="text-xl font-bold text-green-300">Resultado final</h2>
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
        <h3 className="mb-2 font-bold">Ranking final</h3>
        <ol className="list-inside list-decimal space-y-1">
          {ranking.map((player) => (
            <li key={player.id}>
              {player.name} - {player.score} pts
            </li>
          ))}
        </ol>
      </div>

      <div>
        <h3 className="mb-2 font-bold">Respostas por rodada</h3>

        {roundHistory.length === 0 ? (
          <p className="text-gray-300">Sem historico de rodadas registrado.</p>
        ) : (
          <div className="space-y-4">
            {roundHistory.map((entry: RoundHistoryEntry) => (
              <div key={entry.round} className="rounded bg-gray-800 p-3">
                <h4 className="mb-2 font-semibold text-yellow-300">
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
        className="rounded bg-blue-600 px-4 py-2 hover:bg-blue-500"
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

function resolveDeadlineMs(roundDeadlineAt: unknown) {
  if (!roundDeadlineAt) return null;

  if (typeof roundDeadlineAt === "string") {
    const timestamp = new Date(roundDeadlineAt).getTime();
    return Number.isFinite(timestamp) ? timestamp : null;
  }

  if (typeof roundDeadlineAt === "object") {
    const maybeSeconds =
      "seconds" in roundDeadlineAt
        ? roundDeadlineAt.seconds
        : "_seconds" in roundDeadlineAt
          ? roundDeadlineAt._seconds
          : null;

    if (typeof maybeSeconds === "number") {
      return maybeSeconds * 1000;
    }
  }

  return null;
}
