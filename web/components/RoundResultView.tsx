import { Player, RoundHistoryEntry } from "@/types/game";
import Chip from "./Chip";

type Props = {
  entry: RoundHistoryEntry;
  players: Player[];
};

export default function RoundResultView({ entry, players }: Props) {
  return (
    <div className="overflow-hidden border-4 border-retro-orange">
      <div className="bg-gradient-to-r from-retro-yellow to-retro-orange px-4 py-2 text-center font-bold tracking-wide text-gray-900 uppercase">
        Resultado da rodada {entry.round}
      </div>

      <div className="space-y-3 bg-white p-4">
        {entry.answers.map((a) => {
          const player = players.find((p) => p.id === a.playerId);
          const correct = a.points > 0;

          return (
            <div
              key={`${entry.round}-${a.playerId}`}
              className="flex items-center justify-between gap-3 border-b border-gray-200 pb-3 last:border-0 last:pb-0"
            >
              <div className="min-w-0">
                <p className="font-bold text-gray-900">{player?.name || "?"}</p>
                <p className="truncate text-sm text-gray-600">
                  Palpite: <span className="font-semibold">{a.answer}</span>
                </p>
                {a.alreadyUsed && (
                  <p className="text-xs text-retro-red">Item já usado nesta partida</p>
                )}
                {!correct && !a.alreadyUsed && (
                  <p className="text-xs text-retro-red">Não está no Top 100</p>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <span
                  className={`text-lg font-bold ${correct ? "text-retro-green" : "text-retro-red"}`}
                >
                  {correct ? "✓" : "✗"}
                </span>
                <Chip color={correct ? "yellow" : "red"}>{a.points}</Chip>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
