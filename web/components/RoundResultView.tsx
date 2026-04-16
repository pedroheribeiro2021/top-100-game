import { Player } from "@/types/game";

type PlayerWithRoundInfo = Player & {
  lastAnswer?: string;
  lastPosition?: number;
  lastPoints?: number;
};

type Props = {
  game: {
    currentRound: number;
    players: PlayerWithRoundInfo[];
  };
};

export default function RoundResultView({ game }: Props) {
  const currentPlayerId =
    typeof window !== "undefined" ? localStorage.getItem("playerId") : null;
  const currentPlayer = game.players.find((p) => p.id === currentPlayerId);

  return (
    <div>
      <h2>Resultado da Rodada {game.currentRound}</h2>

      <p>Sua resposta: {currentPlayer?.lastAnswer}</p>
      <p>Posição no ranking: {currentPlayer?.lastPosition}</p>
      <p>Pontos ganhos: {currentPlayer?.lastPoints}</p>

      <h3>Ranking Parcial</h3>
      <ul>
        {game.players
          .sort(
            (a: PlayerWithRoundInfo, b: PlayerWithRoundInfo) =>
              b.score - a.score,
          )
          .map((p: PlayerWithRoundInfo) => (
            <li key={p.id}>
              {p.name} - {p.score} pts
            </li>
          ))}
      </ul>

      {game.currentRound < 5 ? (
        <button>Próxima rodada</button>
      ) : (
        <button>Ver resultado final</button>
      )}
    </div>
  );
}
