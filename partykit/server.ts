import type * as Party from "partykit/server";

import { RoomConnectionTracker } from "./connection-tracker";
import { parseClientMessage } from "./parse-client-message";
import {
  broadcastBuzzLocked,
  broadcastGameEnded,
  broadcastSessionState,
  loadRoomState,
  saveRoomState,
  sendError,
  sendSessionState,
} from "./room-helpers";
import { getBoardClueIds, getClueById } from "../src/lib/board-clue";
import type { Player, RoomState } from "../src/types/game";
import type { ClientMessage } from "../src/types/messages";

function normalizeDisplayName(name: string): string {
  return name.trim();
}

/** Invariants expected whenever `phase === "board"` before opening a clue. */
function boardPhaseCleanForNewClue(state: RoomState): boolean {
  return (
    state.currentClueId === null &&
    state.buzzWinnerPlayerId === null &&
    !state.buzzOpen
  );
}

/** After updating `answeredClueIds`, choose board vs game over when leaving a clue. */
function nextPhaseWhenClueFinishes(state: RoomState): "board" | "game_over" {
  if (!state.board) {
    return "board";
  }
  const ids = getBoardClueIds(state.board);
  if (ids.length === 0) {
    return "board";
  }
  const allAnswered = ids.every((id) => state.answeredClueIds.includes(id));
  return allAnswered ? "game_over" : "board";
}

function finalizeGameOverState(state: RoomState): RoomState {
  return {
    ...state,
    phase: "game_over",
    currentClueId: null,
    buzzWinnerPlayerId: null,
    buzzOpen: false,
  };
}

async function saveSessionAndMaybeGameEnded(
  room: Party.Room,
  state: RoomState,
): Promise<void> {
  await saveRoomState(room, state);
  broadcastSessionState(room, state);
  if (state.phase === "game_over") {
    broadcastGameEnded(room, state.players);
  }
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
  connections: RoomConnectionTracker,
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
      connections.attachHost(sender.id);
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
      if (joinState.hostId !== null && msg.playerId === joinState.hostId) {
        sendError(sender, "That player id cannot join as a contestant.");
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
        connections.attachPlayer(sender.id, msg.playerId);
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
      connections.attachPlayer(sender.id, msg.playerId);
      return;
    }
    case "RECONNECT_HOST": {
      const rh = await loadRoomState(room);
      if (rh.hostId === null || msg.hostId !== rh.hostId) {
        sendError(sender, "You are not the host of this session.");
        return;
      }
      connections.attachHost(sender.id);
      return;
    }
    case "RECONNECT_PLAYER": {
      const rs = await loadRoomState(room);
      const idx = rs.players.findIndex((p) => p.id === msg.playerId);
      if (idx < 0) {
        sendError(sender, "You are not in this session.");
        return;
      }
      connections.attachPlayer(sender.id, msg.playerId);
      if (rs.players[idx].connected) {
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
      if (!boardPhaseCleanForNewClue(oc)) {
        sendError(sender, "Finish the current clue before opening another.");
        return;
      }
      const clue = getClueById(oc.board, msg.clueId);
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
      const buzzState = await loadRoomState(room);
      const rosterIdx = buzzState.players.findIndex(
        (p) => p.id === msg.playerId,
      );
      if (rosterIdx < 0) {
        sendError(sender, "You are not a player in this session.");
        return;
      }
      const rosterPlayer = buzzState.players[rosterIdx];
      if (!rosterPlayer.connected) {
        sendError(sender, "Reconnect before buzzing.");
        return;
      }
      if (buzzState.phase !== "clue_open") {
        sendError(sender, "Buzzing is not open.");
        return;
      }
      if (!buzzState.buzzOpen) {
        sendError(sender, "Buzzing is closed.");
        return;
      }
      if (buzzState.buzzWinnerPlayerId !== null) {
        sendError(sender, "Someone already buzzed in.");
        return;
      }
      if (buzzState.currentClueId === null) {
        sendError(sender, "There is no active clue.");
        return;
      }
      if (buzzState.answeredClueIds.includes(buzzState.currentClueId)) {
        sendError(sender, "This clue is no longer open for buzzing.");
        return;
      }
      if (
        !buzzState.board ||
        !getClueById(buzzState.board, buzzState.currentClueId)
      ) {
        sendError(sender, "Active clue is not on the board.");
        return;
      }

      const nextBuzz: RoomState = {
        ...buzzState,
        phase: "judging",
        buzzWinnerPlayerId: msg.playerId,
        buzzOpen: false,
      };
      await saveRoomState(room, nextBuzz);
      broadcastSessionState(room, nextBuzz);
      broadcastBuzzLocked(room, msg.playerId);
      return;
    }
    case "MARK_CORRECT": {
      const mc = await loadRoomState(room);
      if (msg.actorId !== mc.hostId) {
        sendError(sender, "Only the host can mark an answer.");
        return;
      }
      if (mc.phase !== "judging") {
        sendError(sender, "You can only mark correct during judging.");
        return;
      }
      if (mc.buzzWinnerPlayerId === null) {
        sendError(sender, "There is no player to judge.");
        return;
      }
      if (msg.playerId !== mc.buzzWinnerPlayerId) {
        sendError(sender, "That is not the current buzzer.");
        return;
      }
      if (mc.currentClueId === null || !mc.board) {
        sendError(sender, "There is no active clue.");
        return;
      }
      const clueMc = getClueById(mc.board, mc.currentClueId);
      if (!clueMc) {
        sendError(sender, "Active clue is not on the board.");
        return;
      }
      if (mc.answeredClueIds.includes(mc.currentClueId)) {
        sendError(sender, "That clue is already marked answered.");
        return;
      }
      const winIdx = mc.players.findIndex(
        (p) => p.id === mc.buzzWinnerPlayerId,
      );
      if (winIdx < 0) {
        sendError(sender, "Buzz winner is not in the roster.");
        return;
      }

      const playersMc = [...mc.players];
      const prev = playersMc[winIdx];
      playersMc[winIdx] = {
        ...prev,
        score: prev.score + clueMc.value,
      };
      const answeredMc = [...mc.answeredClueIds, mc.currentClueId];
      const baseMc: RoomState = {
        ...mc,
        players: playersMc,
        answeredClueIds: answeredMc,
        currentClueId: null,
        buzzWinnerPlayerId: null,
        buzzOpen: false,
      };
      const nextMc: RoomState = {
        ...baseMc,
        phase: nextPhaseWhenClueFinishes(baseMc),
      };
      await saveSessionAndMaybeGameEnded(room, nextMc);
      return;
    }
    case "MARK_INCORRECT": {
      const mi = await loadRoomState(room);
      if (msg.actorId !== mi.hostId) {
        sendError(sender, "Only the host can mark an answer.");
        return;
      }
      if (mi.phase !== "judging") {
        sendError(sender, "You can only mark incorrect during judging.");
        return;
      }
      if (mi.buzzWinnerPlayerId === null) {
        sendError(sender, "There is no player to judge.");
        return;
      }
      if (msg.playerId !== mi.buzzWinnerPlayerId) {
        sendError(sender, "That is not the current buzzer.");
        return;
      }

      const nextMi: RoomState = {
        ...mi,
        buzzWinnerPlayerId: null,
        buzzOpen: false,
      };
      await saveRoomState(room, nextMi);
      broadcastSessionState(room, nextMi);
      return;
    }
    case "REOPEN_BUZZ": {
      const rb = await loadRoomState(room);
      if (msg.actorId !== rb.hostId) {
        sendError(sender, "Only the host can reopen buzzing.");
        return;
      }
      if (rb.phase !== "judging") {
        sendError(sender, "You can only reopen buzz during judging.");
        return;
      }
      if (rb.currentClueId === null) {
        sendError(sender, "There is no active clue.");
        return;
      }
      if (!rb.board) {
        sendError(sender, "No board is loaded for this session.");
        return;
      }
      if (rb.buzzWinnerPlayerId !== null) {
        sendError(sender, "Resolve or clear the current buzzer first.");
        return;
      }
      if (rb.answeredClueIds.includes(rb.currentClueId)) {
        sendError(sender, "That clue is already finished.");
        return;
      }
      if (!getClueById(rb.board, rb.currentClueId)) {
        sendError(sender, "Active clue is not on the board.");
        return;
      }

      const nextRb: RoomState = {
        ...rb,
        phase: "clue_open",
        buzzOpen: true,
      };
      await saveRoomState(room, nextRb);
      broadcastSessionState(room, nextRb);
      return;
    }
    case "CLOSE_CLUE": {
      const cc = await loadRoomState(room);
      if (msg.actorId !== cc.hostId) {
        sendError(sender, "Only the host can close a clue.");
        return;
      }
      if (cc.phase !== "clue_open" && cc.phase !== "judging") {
        sendError(sender, "No active clue to close.");
        return;
      }
      if (cc.currentClueId === null || !cc.board) {
        sendError(sender, "There is no active clue.");
        return;
      }
      if (cc.answeredClueIds.includes(cc.currentClueId)) {
        sendError(sender, "That clue is already finished.");
        return;
      }
      const clueCc = getClueById(cc.board, cc.currentClueId);
      if (!clueCc) {
        sendError(sender, "Active clue is not on the board.");
        return;
      }

      const answeredCc = [...cc.answeredClueIds, cc.currentClueId];
      const baseCc: RoomState = {
        ...cc,
        answeredClueIds: answeredCc,
        currentClueId: null,
        buzzWinnerPlayerId: null,
        buzzOpen: false,
      };
      const nextCc: RoomState = {
        ...baseCc,
        phase: nextPhaseWhenClueFinishes(baseCc),
      };
      await saveSessionAndMaybeGameEnded(room, nextCc);
      return;
    }
    case "END_GAME": {
      const eg = await loadRoomState(room);
      if (msg.actorId !== eg.hostId) {
        sendError(sender, "Only the host can end the game.");
        return;
      }
      if (eg.phase === "lobby") {
        sendError(sender, "Start the game before ending it.");
        return;
      }
      if (eg.phase === "game_over") {
        sendError(sender, "The game is already over.");
        return;
      }

      const nextEg = finalizeGameOverState(eg);
      await saveSessionAndMaybeGameEnded(room, nextEg);
      return;
    }
  }
}

/** Cleopardy PartyKit room — authoritative game state and validation. */
export default class CleopardyRoom implements Party.Server {
  private readonly connections = new RoomConnectionTracker();

  constructor(readonly room: Party.Room) {}

  async onConnect(connection: Party.Connection): Promise<void> {
    const state = await loadRoomState(this.room);
    sendSessionState(connection, state);
  }

  async onClose(connection: Party.Connection): Promise<void> {
    const lostPlayerId = this.connections.onConnectionClosed(connection.id);
    if (!lostPlayerId) {
      return;
    }
    const rs = await loadRoomState(this.room);
    const idx = rs.players.findIndex((p) => p.id === lostPlayerId);
    if (idx < 0) {
      return;
    }
    if (!rs.players[idx].connected) {
      return;
    }
    const players = [...rs.players];
    players[idx] = { ...players[idx], connected: false };
    const next: RoomState = { ...rs, players };
    await saveRoomState(this.room, next);
    broadcastSessionState(this.room, next);
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

    await handleClientMessage(this.room, sender, clientMsg, this.connections);
  }
}
