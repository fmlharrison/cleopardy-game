export type Clue = {
  id: string;
  value: number;
  question: string;
  answer: string;
};

export type Category = {
  id: string;
  name: string;
  clues: Clue[];
};

export type Board = {
  title: string;
  categories: Category[];
};

export type Player = {
  id: string;
  name: string;
  score: number;
  connected: boolean;
  joinOrder: number;
};

export type GamePhase =
  | "lobby"
  | "board"
  | "clue_open"
  | "judging"
  | "game_over";

export type RoomState = {
  sessionCode: string;
  hostId: string | null;
  phase: GamePhase;
  board: Board | null;
  players: Player[];
  answeredClueIds: string[];
  currentClueId: string | null;
  buzzOpen: boolean;
  buzzWinnerPlayerId: string | null;
};

/** Minimal payload for `GAME_ENDED` / end-game UI. */
export type RankedPlayer = {
  rank: number;
  playerId: string;
  name: string;
  score: number;
  joinOrder: number;
};
