"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { GameBoardGrid } from "@/components/game/GameBoardGrid";
import { GameScoreboard } from "@/components/game/GameScoreboard";
import { readStoredId, STORAGE_KEYS } from "@/lib/ids";
import type { RoomState } from "@/types/game";
import type { ClientMessage } from "@/types/messages";

import {
  getPartySocketUrl,
  parseServerMessage,
  stringifyClientMessage,
} from "@/lib/websocket";

export type GameRoomRole = "host" | "player";

export type GameRoomClientProps = {
  sessionCode: string;
  role: GameRoomRole;
};

function messageRaw(data: string | ArrayBuffer | Blob): string | null {
  if (typeof data === "string") {
    return data;
  }
  if (data instanceof ArrayBuffer) {
    return new TextDecoder().decode(data);
  }
  return null;
}

function sortPlayersByJoinOrder(players: RoomState["players"]) {
  return [...players].sort((a, b) => a.joinOrder - b.joinOrder);
}

function phaseTitle(phase: RoomState["phase"]): string {
  switch (phase) {
    case "lobby":
      return "Lobby";
    case "board":
      return "Game";
    case "clue_open":
      return "Game";
    case "judging":
      return "Game";
    case "game_over":
      return "Game over";
    default: {
      const _x: never = phase;
      return _x;
    }
  }
}

export function GameRoomClient({ sessionCode, role }: GameRoomClientProps) {
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [wsReady, setWsReady] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const url = getPartySocketUrl(sessionCode);
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setWsReady(true);
      if (role === "player") {
        const playerId = readStoredId(STORAGE_KEYS.playerId);
        if (playerId) {
          const msg: ClientMessage = {
            type: "RECONNECT_PLAYER",
            playerId,
          };
          ws.send(stringifyClientMessage(msg));
        }
      }
    };

    ws.onmessage = (ev: MessageEvent<string | ArrayBuffer | Blob>) => {
      const raw = messageRaw(ev.data);
      if (!raw) {
        return;
      }
      const parsed = parseServerMessage(raw);
      if (!parsed) {
        return;
      }
      if (parsed.type === "SESSION_STATE") {
        setRoomState(parsed.state);
        setConnectError(null);
        setActionError(null);
      }
      if (parsed.type === "ERROR") {
        setActionError(parsed.message);
      }
    };

    ws.onerror = () => {
      setConnectError(
        `Could not connect to PartyKit. Check the dev server and URL. Tried: ${url}`,
      );
    };

    ws.onclose = () => {
      setWsReady(false);
      if (wsRef.current === ws) {
        wsRef.current = null;
      }
    };

    return () => {
      ws.close();
      if (wsRef.current === ws) {
        wsRef.current = null;
      }
    };
  }, [sessionCode, role]);

  const handleStartGame = useCallback(() => {
    setActionError(null);
    const hostId = readStoredId(STORAGE_KEYS.hostId);
    const ws = wsRef.current;
    if (!hostId || !ws || ws.readyState !== WebSocket.OPEN) {
      setActionError("Cannot start: not connected or missing host id.");
      return;
    }
    const msg: ClientMessage = { type: "START_GAME", actorId: hostId };
    ws.send(stringifyClientMessage(msg));
  }, []);

  if (connectError && !roomState) {
    return (
      <main className="mx-auto flex min-h-full max-w-lg flex-col gap-4 px-6 py-16">
        <p className="text-sm text-red-700 dark:text-red-300" role="alert">
          {connectError}
        </p>
        <Link
          href="/"
          className="text-sm font-medium text-zinc-700 underline dark:text-zinc-300"
        >
          ← Home
        </Link>
      </main>
    );
  }

  if (!roomState) {
    return (
      <main className="mx-auto flex min-h-full max-w-lg flex-col gap-4 px-6 py-16">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Connecting…</p>
      </main>
    );
  }

  const phase = roomState.phase;
  const isLobby = phase === "lobby";
  const isBoardPhase =
    phase === "board" || phase === "clue_open" || phase === "judging";
  const isGameOver = phase === "game_over";

  const sortedLobbyPlayers = sortPlayersByJoinOrder(roomState.players);
  const hostIdStored = readStoredId(STORAGE_KEYS.hostId);
  const canHostStart =
    role === "host" &&
    wsReady &&
    isLobby &&
    hostIdStored !== null &&
    hostIdStored === roomState.hostId;

  return (
    <main className="mx-auto flex min-h-full max-w-4xl flex-col gap-8 px-6 py-16">
      <header className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          {role === "host" ? "Host" : "Player"}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          {phaseTitle(phase)}
        </h1>
        <p className="font-mono text-sm text-zinc-700 dark:text-zinc-300">
          Session: {sessionCode}
        </p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Phase: <span className="font-mono">{phase}</span>
        </p>
        {!wsReady ? (
          <p className="text-xs text-amber-700 dark:text-amber-300">
            Reconnecting…
          </p>
        ) : null}
      </header>

      {actionError ? (
        <p className="text-sm text-red-700 dark:text-red-300" role="alert">
          {actionError}
        </p>
      ) : null}

      {isLobby ? (
        <>
          {role === "host" ? (
            <section className="space-y-3" aria-labelledby="host-lobby-heading">
              <h2
                id="host-lobby-heading"
                className="text-sm font-semibold text-zinc-800 dark:text-zinc-200"
              >
                Before you start
              </h2>
              <p className="text-sm text-zinc-700 dark:text-zinc-300">
                <span className="font-medium">Board:</span>{" "}
                {roomState.board?.title ?? "—"}
              </p>
              {hostIdStored !== roomState.hostId ? (
                <p className="text-xs text-amber-800 dark:text-amber-200">
                  This browser does not match the stored host id. “Start game”
                  may be unavailable until you use the same device that created
                  the session.
                </p>
              ) : null}
              <button
                type="button"
                disabled={!canHostStart}
                onClick={handleStartGame}
                className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
              >
                Start game
              </button>
            </section>
          ) : (
            <section
              className="space-y-2"
              aria-labelledby="player-wait-heading"
            >
              <h2
                id="player-wait-heading"
                className="text-sm font-semibold text-zinc-800 dark:text-zinc-200"
              >
                Waiting
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                The host will start the game when everyone is ready.
              </p>
            </section>
          )}

          <section aria-labelledby="roster-heading" className="space-y-2">
            <h2
              id="roster-heading"
              className="text-sm font-semibold text-zinc-800 dark:text-zinc-200"
            >
              Players ({sortedLobbyPlayers.length} / 6)
            </h2>
            {sortedLobbyPlayers.length === 0 ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                No players yet.
              </p>
            ) : (
              <ul className="divide-y divide-zinc-200 rounded-md border border-zinc-200 dark:divide-zinc-700 dark:border-zinc-700">
                {sortedLobbyPlayers.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between gap-2 px-3 py-2 text-sm"
                  >
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">
                      {p.name}
                    </span>
                    <span
                      className={
                        p.connected
                          ? "text-xs text-emerald-700 dark:text-emerald-400"
                          : "text-xs text-zinc-500 dark:text-zinc-400"
                      }
                    >
                      {p.connected ? "Connected" : "Away"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      ) : null}

      {isBoardPhase ? (
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
          <div className="min-w-0 flex-1 space-y-4">
            {phase !== "board" ? (
              <p
                className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100"
                role="status"
              >
                {phase === "clue_open"
                  ? "A clue is open (full clue UI not built yet)."
                  : null}
                {phase === "judging"
                  ? "Host is judging an answer (judging UI not built yet)."
                  : null}
              </p>
            ) : null}
            {roomState.board ? (
              <GameBoardGrid
                board={roomState.board}
                answeredClueIds={roomState.answeredClueIds}
              />
            ) : (
              <p className="text-sm text-red-700 dark:text-red-300">
                Board data is missing from session state.
              </p>
            )}
            {role === "host" ? (
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                As host, you will open clues from here next; cells are not
                clickable yet.
              </p>
            ) : (
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Watch for the host to open a clue.
              </p>
            )}
          </div>
          <aside className="w-full shrink-0 lg:w-64">
            <GameScoreboard players={roomState.players} showConnection />
          </aside>
        </div>
      ) : null}

      {isGameOver ? (
        <div className="space-y-4">
          <p className="text-sm text-zinc-700 dark:text-zinc-300">
            Final scores below. End-game leaderboard UI can be expanded here.
          </p>
          <GameScoreboard players={roomState.players} showConnection />
        </div>
      ) : null}

      <Link
        href="/"
        className="text-sm font-medium text-zinc-700 underline dark:text-zinc-300"
      >
        ← Home
      </Link>
    </main>
  );
}
