import type { Board } from "../src/types/game";
import type { ClientMessage } from "../src/types/messages";

function nonEmptyTrimmedString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isBoardLike(value: unknown): value is Board {
  if (!value || typeof value !== "object") {
    return false;
  }
  const b = value as Record<string, unknown>;
  return typeof b.title === "string" && Array.isArray(b.categories);
}

/**
 * Best-effort parse of client JSON into `ClientMessage`. Invalid shapes return null.
 */
export function parseClientMessage(data: unknown): ClientMessage | null {
  if (!data || typeof data !== "object") {
    return null;
  }
  const rec = data as Record<string, unknown>;
  const type = rec.type;
  if (typeof type !== "string") {
    return null;
  }

  switch (type) {
    case "HOST_CREATE_SESSION": {
      if (!nonEmptyTrimmedString(rec.hostId) || !isBoardLike(rec.board)) {
        return null;
      }
      return {
        type: "HOST_CREATE_SESSION",
        hostId: rec.hostId.trim(),
        board: rec.board,
      };
    }
    case "JOIN_SESSION": {
      if (
        !nonEmptyTrimmedString(rec.playerId) ||
        typeof rec.name !== "string"
      ) {
        return null;
      }
      const name = rec.name.trim();
      if (!name) {
        return null;
      }
      return {
        type: "JOIN_SESSION",
        playerId: rec.playerId.trim(),
        name,
      };
    }
    case "RECONNECT_HOST": {
      if (!nonEmptyTrimmedString(rec.hostId)) {
        return null;
      }
      return { type: "RECONNECT_HOST", hostId: rec.hostId.trim() };
    }
    case "RECONNECT_PLAYER": {
      if (!nonEmptyTrimmedString(rec.playerId)) {
        return null;
      }
      return { type: "RECONNECT_PLAYER", playerId: rec.playerId.trim() };
    }
    case "START_GAME": {
      if (!nonEmptyTrimmedString(rec.actorId)) {
        return null;
      }
      return { type: "START_GAME", actorId: rec.actorId.trim() };
    }
    case "OPEN_CLUE": {
      if (
        !nonEmptyTrimmedString(rec.actorId) ||
        !nonEmptyTrimmedString(rec.clueId)
      ) {
        return null;
      }
      return {
        type: "OPEN_CLUE",
        actorId: rec.actorId.trim(),
        clueId: rec.clueId.trim(),
      };
    }
    case "BUZZ": {
      if (!nonEmptyTrimmedString(rec.playerId)) {
        return null;
      }
      return { type: "BUZZ", playerId: rec.playerId.trim() };
    }
    case "MARK_CORRECT":
    case "MARK_INCORRECT": {
      if (
        !nonEmptyTrimmedString(rec.actorId) ||
        !nonEmptyTrimmedString(rec.playerId)
      ) {
        return null;
      }
      return {
        type,
        actorId: rec.actorId.trim(),
        playerId: rec.playerId.trim(),
      } as ClientMessage;
    }
    case "REOPEN_BUZZ":
    case "CLOSE_CLUE":
    case "END_GAME": {
      if (!nonEmptyTrimmedString(rec.actorId)) {
        return null;
      }
      return { type, actorId: rec.actorId.trim() } as ClientMessage;
    }
    default:
      return null;
  }
}
