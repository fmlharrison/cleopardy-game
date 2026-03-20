import type { Board } from "../src/types/game";
import type { ClientMessage } from "../src/types/messages";

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
      if (typeof rec.hostId !== "string" || !isBoardLike(rec.board)) {
        return null;
      }
      return {
        type: "HOST_CREATE_SESSION",
        hostId: rec.hostId,
        board: rec.board,
      };
    }
    case "JOIN_SESSION": {
      if (typeof rec.playerId !== "string" || typeof rec.name !== "string") {
        return null;
      }
      return {
        type: "JOIN_SESSION",
        playerId: rec.playerId,
        name: rec.name,
      };
    }
    case "RECONNECT_PLAYER": {
      if (typeof rec.playerId !== "string") {
        return null;
      }
      return { type: "RECONNECT_PLAYER", playerId: rec.playerId };
    }
    case "START_GAME": {
      if (typeof rec.actorId !== "string") {
        return null;
      }
      return { type: "START_GAME", actorId: rec.actorId };
    }
    case "OPEN_CLUE": {
      if (typeof rec.actorId !== "string" || typeof rec.clueId !== "string") {
        return null;
      }
      return {
        type: "OPEN_CLUE",
        actorId: rec.actorId,
        clueId: rec.clueId,
      };
    }
    case "BUZZ": {
      if (typeof rec.playerId !== "string") {
        return null;
      }
      return { type: "BUZZ", playerId: rec.playerId };
    }
    case "MARK_CORRECT":
    case "MARK_INCORRECT": {
      if (typeof rec.actorId !== "string" || typeof rec.playerId !== "string") {
        return null;
      }
      return {
        type,
        actorId: rec.actorId,
        playerId: rec.playerId,
      } as ClientMessage;
    }
    case "REOPEN_BUZZ":
    case "CLOSE_CLUE":
    case "END_GAME": {
      if (typeof rec.actorId !== "string") {
        return null;
      }
      return { type, actorId: rec.actorId } as ClientMessage;
    }
    default:
      return null;
  }
}
