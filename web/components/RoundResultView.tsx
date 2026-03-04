type Props = {
  game: any;
};

export default function RoundResultView({ game }: Props) {
  const currentPlayer = game.players.find(
    (p: any) => p.id === localStorage.getItem("playerId"),
  );

  return (
    <div>
      <h2>Resultado da Rodada {game.currentRound}</h2>

      <p>Sua resposta: {currentPlayer?.lastAnswer}</p>
      <p>Posição no ranking: {currentPlayer?.lastPosition}</p>
      <p>Pontos ganhos: {currentPlayer?.lastPoints}</p>

      <h3>Ranking Parcial</h3>
      <ul>
        {game.players
          .sort((a: any, b: any) => b.score - a.score)
          .map((p: any) => (
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
