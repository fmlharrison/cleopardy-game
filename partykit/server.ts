import type * as Party from "partykit/server";

import { parseClientMessage } from "./parse-client-message";
import {
  broadcastSessionState,
  loadRoomState,
  saveRoomState,
  sendError,
  sendSessionState,
} from "./room-helpers";
import type { Board, Player, RoomState } from "../src/types/game";
import type { ClientMessage } from "../src/types/messages";

function normalizeDisplayName(name: string): string {
  return name.trim();
}

function findClueOnBoard(board: Board, clueId: string) {
  for (const category of board.categories) {
    const clue = category.clues.find((c) => c.id === clueId);
    if (clue) {
      return clue;
    }
  }
  return null;
}

function isDuplicatePlayerName(
  players: Player[],
  name: string,
  excludePlayerId?: string,
): boolean {
  const n = normalizeDisplayName(name).toLowerCase();
  if (!n) {
    return false;
  }
  return players.some(
    (p) =>
      p.id !== excludePlayerId &&
      normalizeDisplayName(p.name).toLowerCase() === n,
  );
}

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
      const joinState = await loadRoomState(room);
      if (joinState.hostId === null || joinState.board === null) {
        sendError(
          sender,
          "Session not found or the host has not created it yet.",
        );
        return;
      }
      if (joinState.phase !== "lobby") {
        sendError(sender, "This game has already started. Join is closed.");
        return;
      }

      const displayName = normalizeDisplayName(msg.name);
      if (!displayName) {
        sendError(sender, "Name is required.");
        return;
      }

      const existingIdx = joinState.players.findIndex(
        (p) => p.id === msg.playerId,
      );

      if (existingIdx >= 0) {
        const players = [...joinState.players];
        const existing = players[existingIdx];
        if (
          isDuplicatePlayerName(joinState.players, displayName, msg.playerId) &&
          normalizeDisplayName(existing.name).toLowerCase() !==
            displayName.toLowerCase()
        ) {
          sendError(sender, "That name is already taken.");
          return;
        }
        players[existingIdx] = {
          ...existing,
          name: displayName,
          connected: true,
        };
        const nextJoin: RoomState = { ...joinState, players };
        await saveRoomState(room, nextJoin);
        broadcastSessionState(room, nextJoin);
        return;
      }

      if (joinState.players.length >= 6) {
        sendError(sender, "This room is full (6 players max).");
        return;
      }

      if (isDuplicatePlayerName(joinState.players, displayName)) {
        sendError(sender, "That name is already taken.");
        return;
      }

      const joinOrder =
        joinState.players.length === 0
          ? 0
          : Math.max(...joinState.players.map((p) => p.joinOrder)) + 1;

      const newPlayer: Player = {
        id: msg.playerId,
        name: displayName,
        score: 0,
        connected: true,
        joinOrder,
      };

      const nextJoin: RoomState = {
        ...joinState,
        players: [...joinState.players, newPlayer],
      };
      await saveRoomState(room, nextJoin);
      broadcastSessionState(room, nextJoin);
      return;
    }
    case "RECONNECT_PLAYER": {
      const rs = await loadRoomState(room);
      const idx = rs.players.findIndex((p) => p.id === msg.playerId);
      if (idx < 0) {
        sendError(sender, "You are not in this session.");
        return;
      }
      const players = [...rs.players];
      players[idx] = { ...players[idx], connected: true };
      const nextR: RoomState = { ...rs, players };
      await saveRoomState(room, nextR);
      broadcastSessionState(room, nextR);
      return;
    }
    case "START_GAME": {
      const sg = await loadRoomState(room);
      if (msg.actorId !== sg.hostId) {
        sendError(sender, "Only the host can start the game.");
        return;
      }
      if (sg.phase !== "lobby") {
        sendError(sender, "The game is not in the lobby phase.");
        return;
      }
      const nextSg: RoomState = { ...sg, phase: "board" };
      await saveRoomState(room, nextSg);
      broadcastSessionState(room, nextSg);
      return;
    }
    case "OPEN_CLUE": {
      const oc = await loadRoomState(room);
      if (msg.actorId !== oc.hostId) {
        sendError(sender, "Only the host can open a clue.");
        return;
      }
      if (oc.phase !== "board") {
        sendError(
          sender,
          "Clues can only be opened from the board (finish the current clue first).",
        );
        return;
      }
      if (!oc.board) {
        sendError(sender, "No board is loaded for this session.");
        return;
      }
      const clue = findClueOnBoard(oc.board, msg.clueId);
      if (!clue) {
        sendError(sender, "That clue does not exist on this board.");
        return;
      }
      if (oc.answeredClueIds.includes(msg.clueId)) {
        sendError(sender, "That clue has already been answered.");
        return;
      }

      const nextOc: RoomState = {
        ...oc,
        phase: "clue_open",
        currentClueId: msg.clueId,
        buzzOpen: true,
        buzzWinnerPlayerId: null,
      };
      await saveRoomState(room, nextOc);
      broadcastSessionState(room, nextOc);
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
