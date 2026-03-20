import type * as Party from "partykit/server";

import type { RoomState } from "../src/types/game";
import type { ServerMessage } from "../src/types/messages";

export const ROOM_STATE_STORAGE_KEY = "cleopardy:roomState";

export function createInitialRoomState(sessionCode: string): RoomState {
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

function storageValueToString(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === "string") {
    return value;
  }
  if (value instanceof ArrayBuffer) {
    return new TextDecoder().decode(value);
  }
  if (ArrayBuffer.isView(value)) {
    return new TextDecoder().decode(
      value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength),
    );
  }
  return null;
}

/**
 * Loads persisted room state, or creates, persists, and returns initial state.
 */
export async function loadRoomState(room: Party.Room): Promise<RoomState> {
  const raw = await room.storage.get(ROOM_STATE_STORAGE_KEY);
  const text = storageValueToString(raw);
  if (!text) {
    const initial = createInitialRoomState(room.id);
    await saveRoomState(room, initial);
    return initial;
  }
  try {
    const parsed = JSON.parse(text) as RoomState;
    if (
      parsed &&
      typeof parsed === "object" &&
      typeof parsed.sessionCode === "string"
    ) {
      if (parsed.sessionCode !== room.id) {
        return { ...parsed, sessionCode: room.id };
      }
      return parsed;
    }
  } catch {
    /* fall through to reset */
  }
  const initial = createInitialRoomState(room.id);
  await saveRoomState(room, initial);
  return initial;
}

export async function saveRoomState(
  room: Party.Room,
  state: RoomState,
): Promise<void> {
  const normalized: RoomState = {
    ...state,
    sessionCode: room.id,
  };
  await room.storage.put(ROOM_STATE_STORAGE_KEY, JSON.stringify(normalized));
}

export function broadcastSessionState(
  room: Party.Room,
  state: RoomState,
  without?: string[],
): void {
  const payload: ServerMessage = { type: "SESSION_STATE", state };
  room.broadcast(JSON.stringify(payload), without);
}

export function sendSessionState(
  connection: Party.Connection,
  state: RoomState,
): void {
  const payload: ServerMessage = { type: "SESSION_STATE", state };
  connection.send(JSON.stringify(payload));
}

export function sendError(connection: Party.Connection, message: string): void {
  const payload: ServerMessage = { type: "ERROR", message };
  connection.send(JSON.stringify(payload));
}
