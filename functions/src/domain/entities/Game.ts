import { Player } from './Player';
import { RankingItem } from './RankingItem';
import { Guess } from './Guess';

export enum ScoringMode {
  HIGH_SCORE_WINS = 'HIGH_SCORE_WINS',
  LOW_SCORE_WINS = 'LOW_SCORE_WINS',
}

export type Round = {
  number: number;
  guesses: Guess[];
};

export type Game = {
  id: string;
  theme: string;
  ranking: RankingItem[];
  players: Player[];
  rounds: Round[];
  scoringMode: ScoringMode;
  maxRounds: number;
  guessTimeLimitSeconds: number;
};
