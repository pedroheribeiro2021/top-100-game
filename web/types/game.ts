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

export type RoundHistoryEntry = {
  round: number;
  answers: RoundAnswer[];
  ranking: Player[];
};

export type Game = {
  id: string;
  theme: string;
  gameCode: string;
  currentRound: number;
  players: Player[];
  /** Só vem preenchido quando status === "FINISHED" (ADR-0002). */
  ranking?: RankingItem[];
  currentRoundAnswers: RoundAnswer[];
  roundHistory?: RoundHistoryEntry[];
  roundDeadlineAt?: string | null;
  status: GameStatus;
  roundPhase: RoundPhase;
  winner?: Player | null;
  rankingSource?: "groq" | "openrouter" | "fallback";
  rankingWarning?: string | null;
};
