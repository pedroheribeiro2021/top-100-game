export type Player = {
  id: string;
  name: string;
  score: number;
};

export type RankingItem = {
  position: number;
  value: string;
};

export type RoundPhase = "ANSWERING" | "RESULT" | null;

export type GameStatus = "RANKING_READY" | "STARTED" | "FINISHED";

export type RoundAnswer = {
  playerId: string;
  answer: string;
  points: number;
};

export type Game = {
  id: string;
  theme: string;
  gameCode: string;
  currentRound: number;
  players: Player[];
  ranking: RankingItem[];
  currentRoundAnswers: RoundAnswer[];
  status: GameStatus;
  roundPhase: RoundPhase;
  winner?: Player | null;
};
