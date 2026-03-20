import type * as Party from "partykit/server";

import type { RoomState } from "../src/types/game";
import type { ServerMessage } from "../src/types/messages";

function initialRoomState(sessionCode: string): RoomState {
  return {
    sessionCode,
    hostId: null,
    phase: "lobby",
    board: null,
    players: [],
    answeredClueIds: [],
    currentClueId: null,
    buzzOpen: false,
    buzzWinnerPlayerId: null,
  };
}

function sessionStateMessage(state: RoomState): ServerMessage {
  return { type: "SESSION_STATE", state };
}

/**
 * PartyKit room server (scaffold). Gameplay and message handling come later.
 */
export default class CleopardyRoom implements Party.Server {
  constructor(readonly room: Party.Room) {}

  onConnect(connection: Party.Connection): void | Promise<void> {
    const state = initialRoomState(this.room.id);
    const payload = sessionStateMessage(state);
    connection.send(JSON.stringify(payload));
  }
}
