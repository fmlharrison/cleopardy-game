import type { Board, RankedPlayer, RoomState } from "./game";

export type ClientMessage =
  | { type: "HOST_CREATE_SESSION"; hostId: string; board: Board }
  | { type: "JOIN_SESSION"; playerId: string; name: string }
  | { type: "RECONNECT_PLAYER"; playerId: string }
  | { type: "START_GAME"; actorId: string }
  | { type: "OPEN_CLUE"; actorId: string; clueId: string }
  | { type: "BUZZ"; playerId: string }
  | { type: "MARK_CORRECT"; actorId: string; playerId: string }
  | { type: "MARK_INCORRECT"; actorId: string; playerId: string }
  | { type: "REOPEN_BUZZ"; actorId: string }
  | { type: "CLOSE_CLUE"; actorId: string }
  | { type: "END_GAME"; actorId: string };

export type ServerMessage =
  | { type: "SESSION_STATE"; state: RoomState }
  | { type: "ERROR"; message: string }
  | { type: "BUZZ_LOCKED"; playerId: string }
  | { type: "GAME_ENDED"; rankings: RankedPlayer[] };
