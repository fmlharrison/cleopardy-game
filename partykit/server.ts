import type * as Party from "partykit/server";

import { parseClientMessage } from "./parse-client-message";
import {
  broadcastSessionState,
  loadRoomState,
  saveRoomState,
  sendError,
  sendSessionState,
} from "./room-helpers";
import type { RoomState } from "../src/types/game";
import type { ClientMessage } from "../src/types/messages";

function messageToString(
  message: string | ArrayBuffer | ArrayBufferView,
): string {
  if (typeof message === "string") {
    return message;
  }
  if (message instanceof ArrayBuffer) {
    return new TextDecoder().decode(message);
  }
  return new TextDecoder().decode(
    message.buffer.slice(
      message.byteOffset,
      message.byteOffset + message.byteLength,
    ),
  );
}

async function handleClientMessage(
  room: Party.Room,
  sender: Party.Connection,
  msg: ClientMessage,
): Promise<void> {
  switch (msg.type) {
    case "HOST_CREATE_SESSION": {
      const state = await loadRoomState(room);
      if (state.hostId !== null && state.board !== null) {
        sendError(sender, "This session already has a host.");
        return;
      }

      const next: RoomState = {
        ...state,
        sessionCode: room.id,
        hostId: msg.hostId,
        board: msg.board,
        phase: "lobby",
        players: [],
        answeredClueIds: [],
        currentClueId: null,
        buzzOpen: false,
        buzzWinnerPlayerId: null,
      };

      await saveRoomState(room, next);
      broadcastSessionState(room, next);
      return;
    }
    case "JOIN_SESSION": {
      sendError(sender, "JOIN_SESSION is not implemented yet.");
      return;
    }
    case "RECONNECT_PLAYER": {
      sendError(sender, "RECONNECT_PLAYER is not implemented yet.");
      return;
    }
    case "START_GAME": {
      sendError(sender, "START_GAME is not implemented yet.");
      return;
    }
    case "OPEN_CLUE": {
      sendError(sender, "OPEN_CLUE is not implemented yet.");
      return;
    }
    case "BUZZ": {
      sendError(sender, "BUZZ is not implemented yet.");
      return;
    }
    case "MARK_CORRECT":
    case "MARK_INCORRECT": {
      sendError(sender, "Judging actions are not implemented yet.");
      return;
    }
    case "REOPEN_BUZZ": {
      sendError(sender, "REOPEN_BUZZ is not implemented yet.");
      return;
    }
    case "CLOSE_CLUE": {
      sendError(sender, "CLOSE_CLUE is not implemented yet.");
      return;
    }
    case "END_GAME": {
      sendError(sender, "END_GAME is not implemented yet.");
      return;
    }
  }
}

/**
 * Cleopardy PartyKit room — typed message wiring; game rules are stubs.
 */
export default class CleopardyRoom implements Party.Server {
  constructor(readonly room: Party.Room) {}

  async onConnect(connection: Party.Connection): Promise<void> {
    const state = await loadRoomState(this.room);
    sendSessionState(connection, state);
  }

  async onMessage(
    message: string | ArrayBuffer | ArrayBufferView,
    sender: Party.Connection,
  ): Promise<void> {
    const text = messageToString(message);
    let data: unknown;
    try {
      data = JSON.parse(text) as unknown;
    } catch {
      sendError(sender, "Invalid JSON message.");
      return;
    }

    const clientMsg = parseClientMessage(data);
    if (!clientMsg) {
      sendError(sender, "Unrecognized message shape.");
      return;
    }

    await handleClientMessage(this.room, sender, clientMsg);
  }
}
