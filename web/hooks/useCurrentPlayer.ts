import { useMemo } from "react";
import { Game, Player } from "@/types/game";

export function useCurrentPlayer(game: Game | null): Player | null {
  return useMemo(() => {
    if (!game) return null;

    const playerId = localStorage.getItem("playerId");
    if (!playerId) return null;

    return game.players.find((p) => p.id === playerId) || null;
  }, [game]);
}