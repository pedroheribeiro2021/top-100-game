export type Player = {
  id: string;
  name: string;
  score: number;
};

export type RankingItem = {
  position: number;
  value: string;
  aliases?: string[];
};

export type RoundPhase = "ANSWERING" | "RESULT" | null;

export type GameStatus =
  | "RANKING_READY"
  | "STARTED"
  | "SUDDEN_DEATH"
  | "FINISHED";

export type RoundAnswer = {
  playerId: string;
  answer: string;
  points: number;
  alreadyUsed: boolean;
};

export type RoundHistoryEntry = {
  round: number;
  answers: RoundAnswer[];
  ranking: Player[];
};

export type Game = {
  id: string;
  theme: string;
  themeId?: string | null;
  gameCode: string;
  hostId: string;
  maxRounds: number;
  roundTimeLimit: number;
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
  /** Ids dos jogadores empatados na liderança durante SUDDEN_DEATH (DOMAIN §6). */
  tiedPlayerIds?: string[];
  /** Id do jogo criado por "jogar novamente", se algum host já iniciou um. */
  rematchGameId?: string | null;
  rankingSource?: "bank" | "groq" | "openrouter";
  rankingWarning?: string | null;
};
