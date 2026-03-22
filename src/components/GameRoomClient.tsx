"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

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

export function GameRoomClient({ sessionCode, role }: GameRoomClientProps) {
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [wsReady, setWsReady] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    setConnectError(null);
    setWsReady(false);
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

  const sortedPlayers = [...roomState.players].sort(
    (a, b) => a.joinOrder - b.joinOrder,
  );
  const isLobby = roomState.phase === "lobby";
  const hostIdStored = readStoredId(STORAGE_KEYS.hostId);
  const canHostStart =
    role === "host" &&
    wsReady &&
    isLobby &&
    hostIdStored !== null &&
    hostIdStored === roomState.hostId;

  return (
    <main className="mx-auto flex min-h-full max-w-2xl flex-col gap-8 px-6 py-16">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {isLobby ? "Lobby" : "Game"}
        </h1>
        <p className="mt-1 font-mono text-sm text-zinc-700 dark:text-zinc-300">
          Session: {sessionCode}
        </p>
        {!wsReady ? (
          <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">
            Reconnecting…
          </p>
        ) : null}
      </div>

      {actionError ? (
        <p className="text-sm text-red-700 dark:text-red-300" role="alert">
          {actionError}
        </p>
      ) : null}

      {!isLobby ? (
        <p className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-300">
          Game in progress (board view not built yet). You can still see the
          roster below.
        </p>
      ) : null}

      {role === "host" ? (
        <section className="space-y-3" aria-labelledby="host-lobby-heading">
          <h2
            id="host-lobby-heading"
            className="text-sm font-semibold text-zinc-800 dark:text-zinc-200"
          >
            Host
          </h2>
          <p className="text-sm text-zinc-700 dark:text-zinc-300">
            <span className="font-medium">Board:</span>{" "}
            {roomState.board?.title ?? "—"}
          </p>
          {role === "host" && hostIdStored !== roomState.hostId ? (
            <p className="text-xs text-amber-800 dark:text-amber-200">
              This browser does not match the stored host id. “Start game” may
              be unavailable until you use the same device that created the
              session.
            </p>
          ) : null}
          {isLobby ? (
            <button
              type="button"
              disabled={!canHostStart}
              onClick={handleStartGame}
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
            >
              Start game
            </button>
          ) : null}
        </section>
      ) : (
        <section className="space-y-2" aria-labelledby="player-wait-heading">
          <h2
            id="player-wait-heading"
            className="text-sm font-semibold text-zinc-800 dark:text-zinc-200"
          >
            Player
          </h2>
          {isLobby ? (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Waiting for the host to start the game…
            </p>
          ) : null}
        </section>
      )}

      <section aria-labelledby="roster-heading" className="space-y-2">
        <h2
          id="roster-heading"
          className="text-sm font-semibold text-zinc-800 dark:text-zinc-200"
        >
          Players ({sortedPlayers.length} / 6)
        </h2>
        {sortedPlayers.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No players yet.
          </p>
        ) : (
          <ul className="divide-y divide-zinc-200 rounded-md border border-zinc-200 dark:divide-zinc-700 dark:border-zinc-700">
            {sortedPlayers.map((p) => (
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

      <Link
        href="/"
        className="text-sm font-medium text-zinc-700 underline dark:text-zinc-300"
      >
        ← Home
      </Link>
    </main>
  );
}
