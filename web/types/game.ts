export type Player = {
  id: string;
  name: string;
  score: number;
};

export type RankingItem = {
  position: number;
  value: string;
};

export type GameStatus =
  | "WAITING_PLAYERS"
  | "RANKING_READY"
  | "STARTED"
  | "FINISHED";

export type Game = {
  id: string;
  theme: string;
  gameCode: string;
  currentRound: number;
  players: Player[];
  ranking: RankingItem[];
  currentRoundAnswers: unknown[];
  status: GameStatus;
  winner?: Player;
};