"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  getGameById,
  joinGame,
  rematchGame,
  startGame,
  submitAnswer,
} from "@/services/api";
import { Game, Player, RoundHistoryEntry } from "@/types/game";
import { useCurrentPlayer } from "@/hooks/useCurrentPlayer";
import RetroButton from "@/components/RetroButton";
import RetroCard from "@/components/RetroCard";
import Chip from "@/components/Chip";
import { RetroColor } from "@/components/RetroCard";
import RoundResultView from "@/components/RoundResultView";

const GAME_POLL_INTERVAL_MS = 2000;
const RANK_COLORS: RetroColor[] = ["pink", "yellow", "cyan"];

export default function GamePage() {
  const params = useParams<{ code: string }>();
  const code = params.code;
  const [game, setGame] = useState<Game | null>(null);
  const [playerName, setPlayerName] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

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

  // "Jogar novamente": quem nao clicou o botao (nao-host) descobre o novo
  // jogo pelo proprio polling do jogo antigo e e redirecionado junto.
  useEffect(() => {
    if (game?.rematchGameId) {
      window.location.href = `/game/${game.rematchGameId}`;
    }
  }, [game?.rematchGameId]);

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

  function handleCopyCode() {
    if (!game) return;
    navigator.clipboard.writeText(game.gameCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (!game) {
    return (
      <main className="flex min-h-screen items-center justify-center p-8 text-white">
        Carregando...
      </main>
    );
  }

  const isHost = currentPlayer?.id === game.hostId;

  return (
    <main className="mx-auto min-h-screen max-w-2xl p-4 text-white">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-widest text-retro-yellow drop-shadow-[2px_2px_0_rgba(0,0,0,0.5)]">
          {game.theme}
        </h1>
      </div>

      {game.rankingSource && (
        <div className="mt-4 border-4 border-blue-400 bg-blue-950/60 p-3 text-center text-sm text-blue-100">
          Tema gerado dinamicamente por IA via {game.rankingSource}.
        </div>
      )}

      {game.status === "SUDDEN_DEATH" && (
        <div className="mt-4 border-4 border-retro-red-dark bg-gradient-to-r from-retro-red to-retro-orange p-3 text-center font-bold tracking-wide text-white uppercase">
          Morte súbita — empate na liderança, só os empatados jogam
        </div>
      )}

      {game.status === "RANKING_READY" && (
        <div className="mt-6 space-y-4">
          <RetroCard color="cyan" className="text-center">
            <p className="text-xs font-bold tracking-wide text-gray-500 uppercase">
              Código da sala
            </p>
            <p className="mt-1 text-3xl font-bold tracking-[0.3em] text-gray-900">
              {game.gameCode}
            </p>
            <button
              onClick={handleCopyCode}
              className="mt-2 text-xs font-bold text-retro-cyan-dark underline"
            >
              {copied ? "Copiado!" : "Copiar código"}
            </button>
          </RetroCard>

          <RetroCard color="yellow">
            <p className="text-sm text-gray-700">
              <span className="font-bold">{game.maxRounds}</span> rodadas ·{" "}
              <span className="font-bold">{game.roundTimeLimit}s</span> por rodada ·{" "}
              <span className="font-bold">{game.players.length}/5</span> jogadores
            </p>
          </RetroCard>

          {!currentPlayer && (
            <RetroCard color="pink" className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                placeholder="Seu nome"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="flex-1 border-2 border-gray-900 p-2 font-mono"
              />

              <RetroButton onClick={handleJoin} disabled={loading}>
                Entrar
              </RetroButton>
            </RetroCard>
          )}

          <RetroCard>
            <p className="mb-2 text-xs font-bold tracking-wide text-gray-500 uppercase">
              Aguardando · Jogadores
            </p>
            <ul className="space-y-1">
              {game.players.map((player: Player) => (
                <li
                  key={player.id}
                  className={`flex items-center justify-between border-b border-gray-200 py-1 last:border-0 ${
                    currentPlayer?.id === player.id ? "font-bold text-retro-pink-dark" : "text-gray-800"
                  }`}
                >
                  <span>
                    {player.name}
                    {player.id === game.hostId && " 👑"}
                  </span>
                  <span>{player.score} pts</span>
                </li>
              ))}
            </ul>
          </RetroCard>

          {isHost && (
            <RetroButton
              onClick={handleStart}
              disabled={game.players.length < 2}
              className="w-full"
            >
              Iniciar partida
            </RetroButton>
          )}
        </div>
      )}

      {(game.status === "STARTED" || game.status === "SUDDEN_DEATH") && (
        <RoundSection game={game} reload={loadGame} currentPlayer={currentPlayer} />
      )}

      {game.status === "FINISHED" && (
        <FinalResultSection game={game} currentPlayer={currentPlayer} />
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
    const deadline = resolveDeadlineMs(game.roundDeadlineAt);
    if (deadline === null) return null;

    const diff = Math.floor((deadline - now) / 1000);
    return Math.max(diff, 0);
  }, [game.roundDeadlineAt, now]);

  const alreadyAnswered = useMemo(() => {
    if (!playerId) return false;

    return (game.currentRoundAnswers || []).some((a) => a.playerId === playerId);
  }, [game.currentRoundAnswers, playerId]);

  const isSuddenDeath = game.status === "SUDDEN_DEATH";
  const activePlayers = isSuddenDeath
    ? game.players.filter((p) => (game.tiedPlayerIds || []).includes(p.id))
    : game.players;
  const isSpectator =
    isSuddenDeath && !!playerId && !(game.tiedPlayerIds || []).includes(playerId);

  // Itens ja acertados nesta partida (qualquer jogador, qualquer rodada) —
  // derivado do roundHistory (ja visivel durante o jogo), sem expor o
  // ranking secreto (ADR-0002): sao so os palpites que ja pontuaram.
  const usedItemsSoFar = useMemo(() => {
    const items = new Set<string>();
    (game.roundHistory || []).forEach((entry) => {
      entry.answers.forEach((a) => {
        if (a.points > 0) items.add(a.answer);
      });
    });
    return Array.from(items);
  }, [game.roundHistory]);

  const lastRoundEntry = (game.roundHistory || [])[
    (game.roundHistory || []).length - 1
  ];

  // A expiracao da rodada e resolvida no servidor (lazy, a cada request -
  // ver applyRoundTimeoutIfNeeded). Aqui so forcamos um reload imediato
  // quando o tempo zera, em vez de esperar o proximo polling de 2s.
  useEffect(() => {
    if (game.status !== "STARTED" && game.status !== "SUDDEN_DEATH") return;
    if (game.roundPhase !== "ANSWERING") return;
    if (secondsLeft === null || secondsLeft > 0) return;
    if (advancing) return;

    const nudge = async () => {
      try {
        setAdvancing(true);
        await reload();
      } finally {
        setAdvancing(false);
      }
    };

    void nudge();
  }, [advancing, game.roundPhase, game.status, reload, secondsLeft]);

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

  const playersAnswered = (game.currentRoundAnswers || []).filter((a) =>
    activePlayers.some((p) => p.id === a.playerId),
  ).length;
  const totalActivePlayers = activePlayers.length;
  const timeProgress = Math.min(
    100,
    Math.max(0, ((secondsLeft ?? game.roundTimeLimit) / game.roundTimeLimit) * 100),
  );

  return (
    <div className="mt-6 space-y-4">
      <RetroCard color="cyan">
        <div className="flex items-center justify-between">
          <h2 className="font-bold uppercase">
            {isSuddenDeath
              ? "Rodada extra — morte súbita"
              : `Rodada ${game.currentRound} de ${game.maxRounds}`}
          </h2>
          <span className="font-mono font-bold text-retro-cyan-dark">
            {secondsLeft === null
              ? formatSeconds(game.roundTimeLimit)
              : formatSeconds(secondsLeft)}
          </span>
        </div>

        <div className="mt-2 h-3 w-full border-2 border-gray-900 bg-gray-100">
          <div
            className="h-full bg-retro-pink transition-all"
            style={{ width: `${timeProgress}%` }}
          />
        </div>

        <p className="mt-2 text-sm text-gray-600">
          Respostas recebidas: {playersAnswered}/{totalActivePlayers}
        </p>
      </RetroCard>

      {game.roundPhase === "ANSWERING" && (
        <RetroCard color="pink" className="space-y-3">
          {isSpectator ? (
            <p className="font-semibold text-gray-500">
              Você não está na morte súbita — só assistindo até o fim desta partida.
            </p>
          ) : !alreadyAnswered ? (
            <div className="flex flex-wrap gap-2">
              <input
                type="text"
                placeholder="Seu palpite"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                className="flex-1 border-2 border-gray-900 p-2 font-mono"
              />

              <RetroButton onClick={handleSubmit} disabled={submitting}>
                Confirmar palpite
              </RetroButton>
            </div>
          ) : (
            <p className="font-semibold text-retro-green-dark">
              Resposta enviada. Aguardando os demais jogadores...
            </p>
          )}

          {currentPlayer && (
            <p className="text-sm text-gray-600">
              Jogando como: <span className="font-semibold">{currentPlayer.name}</span>
            </p>
          )}
        </RetroCard>
      )}

      {lastRoundEntry && (
        <RoundResultView entry={lastRoundEntry} players={game.players} />
      )}

      <RetroCard>
        <h3 className="mb-2 text-xs font-bold tracking-wide text-gray-500 uppercase">
          Placar ao vivo
        </h3>
        <ul className="space-y-1">
          {[...game.players]
            .sort((a, b) => b.score - a.score)
            .map((player, index) => (
              <li key={player.id} className="flex items-center gap-2">
                <Chip color={RANK_COLORS[index] || "cyan"}>{index + 1}</Chip>
                <span className="flex-1 font-semibold text-gray-800">{player.name}</span>
                <span className="font-bold text-gray-900">{player.score} pts</span>
              </li>
            ))}
        </ul>
      </RetroCard>

      {usedItemsSoFar.length > 0 && (
        <RetroCard color="yellow">
          <h3 className="mb-1 text-xs font-bold tracking-wide text-gray-500 uppercase">
            Itens já usados
          </h3>
          <p className="text-sm text-gray-700">{usedItemsSoFar.join(" · ")}</p>
        </RetroCard>
      )}

      <p className="text-center text-xs text-white/80">
        Quanto mais baixo no ranking, mais pontos! Cada item só pode ser usado uma vez.
      </p>
    </div>
  );
}

function FinalResultSection({
  game,
  currentPlayer,
}: {
  game: Game;
  currentPlayer: Player | null;
}) {
  const [rematching, setRematching] = useState(false);
  const [showFullRanking, setShowFullRanking] = useState(false);
  const ranking = [...game.players].sort((a, b) => b.score - a.score);
  const winner = game.winner || ranking[0] || null;
  const roundHistory = game.roundHistory || [];
  const isHost = currentPlayer?.id === game.hostId;

  function handleNewGame() {
    localStorage.removeItem("playerId");
    window.location.href = "/";
  }

  async function handleRematch() {
    if (!currentPlayer) return;

    try {
      setRematching(true);
      const newGame = await rematchGame(game.id, currentPlayer.id);
      window.location.href = `/game/${newGame.id}`;
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Erro ao iniciar nova partida";
      alert(message);
      setRematching(false);
    }
  }

  return (
    <div className="mt-6 space-y-6">
      <div className="border-4 border-retro-orange bg-gradient-to-r from-retro-yellow to-retro-orange p-4 text-center text-gray-900">
        <h2 className="text-xl font-bold tracking-wide uppercase">Resultado final</h2>
        {winner ? (
          <p className="mt-2">
            Vencedor: <span className="font-bold">{winner.name}</span> com{" "}
            <span className="font-bold">{winner.score} pontos</span>
          </p>
        ) : (
          <p>Nenhum vencedor definido.</p>
        )}
      </div>

      <RetroCard>
        <h3 className="mb-2 text-xs font-bold tracking-wide text-gray-500 uppercase">
          Ranking final
        </h3>
        <ol className="space-y-1">
          {ranking.map((player, index) => (
            <li key={player.id} className="flex items-center gap-2">
              <Chip color={RANK_COLORS[index] || "cyan"}>{index + 1}</Chip>
              <span className="flex-1 font-semibold text-gray-800">{player.name}</span>
              <span className="font-bold text-gray-900">{player.score} pts</span>
            </li>
          ))}
        </ol>
      </RetroCard>

      {roundHistory.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xs font-bold tracking-wide text-white/80 uppercase">
            Respostas por rodada
          </h3>
          {roundHistory.map((entry: RoundHistoryEntry) => (
            <RoundResultView key={entry.round} entry={entry} players={game.players} />
          ))}
        </div>
      )}

      {game.ranking && (
        <div>
          <RetroButton
            variant="outline"
            onClick={() => setShowFullRanking((v) => !v)}
            className="w-full"
          >
            {showFullRanking ? "Ocultar Top 100 completo" : "Ver Top 100 completo"}
          </RetroButton>

          {showFullRanking && (
            <RetroCard color="cyan" className="mt-2">
              <h3 className="mb-2 font-bold text-gray-900">
                Top 100 completo — {game.theme}
              </h3>
              <ol className="max-h-64 list-inside list-decimal space-y-1 overflow-y-auto text-sm text-gray-800">
                {[...game.ranking]
                  .sort((a, b) => a.position - b.position)
                  .map((item) => (
                    <li key={item.position}>{item.value}</li>
                  ))}
              </ol>
            </RetroCard>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        {isHost && (
          <RetroButton onClick={handleRematch} disabled={rematching}>
            {rematching ? "Criando nova partida..." : "Jogar novamente"}
          </RetroButton>
        )}

        <RetroButton variant="secondary" onClick={handleNewGame}>
          Nova sala
        </RetroButton>
      </div>
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
