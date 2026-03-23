"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { ClueView } from "@/components/ClueView";
import { EndGameLeaderboard } from "@/components/game/EndGameLeaderboard";
import { GameBoardGrid } from "@/components/game/GameBoardGrid";
import { GameScoreboard } from "@/components/game/GameScoreboard";
import { StatusBanner } from "@/components/ui/StatusBanner";
import { readStoredId, STORAGE_KEYS } from "@/lib/ids";
import type { RoomState } from "@/types/game";
import type { ClientMessage } from "@/types/messages";

import { getClueById } from "@/lib/board-clue";
import { rankPlayers } from "@/lib/ranking";
import { ui } from "@/lib/ui";
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

/** Lobby roster display only (join order). Score standings use `sortPlayersByStandings`. */
function sortLobbyRosterByJoinOrder(players: RoomState["players"]) {
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
  const [hasReceivedLiveState, setHasReceivedLiveState] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const roomStateRef = useRef<RoomState | null>(null);
  /** Mirrors `hasReceivedLiveState` for `onclose` (avoids stale closures). */
  const receivedLiveStateRef = useRef(false);

  useEffect(() => {
    roomStateRef.current = roomState;
  }, [roomState]);

  useEffect(() => {
    let cancelled = false;

    const url = getPartySocketUrl(sessionCode);
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      if (cancelled) {
        return;
      }
      setConnectError(null);
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
      } else if (role === "host") {
        const hostId = readStoredId(STORAGE_KEYS.hostId);
        if (hostId) {
          const msg: ClientMessage = {
            type: "RECONNECT_HOST",
            hostId,
          };
          ws.send(stringifyClientMessage(msg));
        }
      }
    };

    ws.onmessage = (ev: MessageEvent<string | ArrayBuffer | Blob>) => {
      if (cancelled) {
        return;
      }
      const raw = messageRaw(ev.data);
      if (!raw) {
        return;
      }
      const parsed = parseServerMessage(raw);
      if (!parsed) {
        return;
      }
      if (parsed.type === "SESSION_STATE") {
        receivedLiveStateRef.current = true;
        setHasReceivedLiveState(true);
        setRoomState(parsed.state);
        setConnectError(null);
      }
      if (parsed.type === "ERROR") {
        setActionError(parsed.message);
      }
    };

    ws.onerror = () => {
      if (cancelled) {
        return;
      }
      setConnectError(
        `Could not connect to PartyKit. Check the dev server and URL. Tried: ${url}`,
      );
    };

    ws.onclose = () => {
      if (cancelled) {
        return;
      }
      setWsReady(false);
      if (wsRef.current === ws) {
        wsRef.current = null;
      }
      setConnectError((prev) => {
        if (receivedLiveStateRef.current) {
          return prev;
        }
        return (
          prev ??
          "The connection closed before the room state loaded. Check that PartyKit is running (`npm run dev:all` or `npm run party:dev`) and refresh this page."
        );
      });
    };

    return () => {
      cancelled = true;
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

  const handleHostOpenClue = useCallback((clueId: string) => {
    setActionError(null);
    const hostId = readStoredId(STORAGE_KEYS.hostId);
    const ws = wsRef.current;
    if (!hostId || !ws || ws.readyState !== WebSocket.OPEN) {
      setActionError("Cannot open clue: not connected or missing host id.");
      return;
    }
    const msg: ClientMessage = {
      type: "OPEN_CLUE",
      actorId: hostId,
      clueId,
    };
    ws.send(stringifyClientMessage(msg));
  }, []);

  const handleBuzz = useCallback(() => {
    setActionError(null);
    const playerId = readStoredId(STORAGE_KEYS.playerId);
    const ws = wsRef.current;
    if (!playerId || !ws || ws.readyState !== WebSocket.OPEN) {
      setActionError("Cannot buzz: not connected or missing player id.");
      return;
    }
    const msg: ClientMessage = { type: "BUZZ", playerId };
    ws.send(stringifyClientMessage(msg));
  }, []);

  const handleHostMarkCorrect = useCallback(() => {
    setActionError(null);
    const hostId = readStoredId(STORAGE_KEYS.hostId);
    const ws = wsRef.current;
    const winnerId = roomStateRef.current?.buzzWinnerPlayerId;
    if (!hostId || !winnerId || !ws || ws.readyState !== WebSocket.OPEN) {
      setActionError("Cannot mark correct: not ready.");
      return;
    }
    const msg: ClientMessage = {
      type: "MARK_CORRECT",
      actorId: hostId,
      playerId: winnerId,
    };
    ws.send(stringifyClientMessage(msg));
  }, []);

  const handleHostMarkIncorrect = useCallback(() => {
    setActionError(null);
    const hostId = readStoredId(STORAGE_KEYS.hostId);
    const ws = wsRef.current;
    const winnerId = roomStateRef.current?.buzzWinnerPlayerId;
    if (!hostId || !winnerId || !ws || ws.readyState !== WebSocket.OPEN) {
      setActionError("Cannot mark incorrect: not ready.");
      return;
    }
    const msg: ClientMessage = {
      type: "MARK_INCORRECT",
      actorId: hostId,
      playerId: winnerId,
    };
    ws.send(stringifyClientMessage(msg));
  }, []);

  const handleHostReopenBuzz = useCallback(() => {
    setActionError(null);
    const hostId = readStoredId(STORAGE_KEYS.hostId);
    const ws = wsRef.current;
    if (!hostId || !ws || ws.readyState !== WebSocket.OPEN) {
      setActionError("Cannot reopen buzz: not connected or missing host id.");
      return;
    }
    const msg: ClientMessage = { type: "REOPEN_BUZZ", actorId: hostId };
    ws.send(stringifyClientMessage(msg));
  }, []);

  const handleHostCloseClue = useCallback(() => {
    setActionError(null);
    const hostId = readStoredId(STORAGE_KEYS.hostId);
    const ws = wsRef.current;
    if (!hostId || !ws || ws.readyState !== WebSocket.OPEN) {
      setActionError("Cannot close clue: not connected or missing host id.");
      return;
    }
    const msg: ClientMessage = { type: "CLOSE_CLUE", actorId: hostId };
    ws.send(stringifyClientMessage(msg));
  }, []);

  const handleEndGame = useCallback(() => {
    setActionError(null);
    const hostId = readStoredId(STORAGE_KEYS.hostId);
    const ws = wsRef.current;
    if (!hostId || !ws || ws.readyState !== WebSocket.OPEN) {
      setActionError("Cannot end game: not connected or missing host id.");
      return;
    }
    const msg: ClientMessage = { type: "END_GAME", actorId: hostId };
    ws.send(stringifyClientMessage(msg));
  }, []);

  if (connectError && !roomState) {
    return (
      <main className={`${ui.page} ${ui.pageNarrow} gap-6`}>
        <h1 className={ui.h1}>Game</h1>
        <p className="font-mono text-sm text-zinc-600 dark:text-zinc-400">
          Session: {sessionCode}
        </p>
        <StatusBanner variant="error" title="Could not connect">
          <p>{connectError}</p>
        </StatusBanner>
        <Link href="/" className={ui.linkBack}>
          ← Home
        </Link>
      </main>
    );
  }

  const hostIdForLoad = readStoredId(STORAGE_KEYS.hostId);
  const playerIdForLoad = readStoredId(STORAGE_KEYS.playerId);
  const missingHostIdentity = role === "host" && !hostIdForLoad;
  const missingPlayerIdentity = role === "player" && !playerIdForLoad;

  if (!roomState) {
    return (
      <main className={`${ui.page} ${ui.pageNarrow} gap-6`}>
        <h1 className={ui.h1}>Game</h1>
        <p className="font-mono text-sm text-zinc-600 dark:text-zinc-400">
          Session: {sessionCode}
        </p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          View:{" "}
          <span className="font-medium text-zinc-700 dark:text-zinc-300">
            {role === "host" ? "Host" : "Player"}
          </span>{" "}
          (
          <code className="rounded bg-zinc-200 px-1 text-[11px] dark:bg-zinc-800">
            ?role={role}
          </code>
          )
        </p>
        <StatusBanner variant="info" title="Connecting to live session">
          <p>
            Syncing room state from PartyKit. There can be a short gap before
            the first update—this is normal on refresh or direct navigation.
            Reconnecting should restore an in-progress game (lobby, board, or
            clue) automatically.
          </p>
        </StatusBanner>
        {missingHostIdentity ? (
          <StatusBanner
            variant="warning"
            title="No host identity in this browser"
          >
            <p>
              Host controls need the id from the device that created this
              session. Open{" "}
              <Link
                href="/host"
                className="font-medium underline underline-offset-2"
              >
                Host
              </Link>{" "}
              here first, or use the original host link.
            </p>
          </StatusBanner>
        ) : null}
        {missingPlayerIdentity ? (
          <StatusBanner
            variant="warning"
            title="No player identity in this browser"
          >
            <p>
              Use{" "}
              <Link
                href="/join"
                className="font-medium underline underline-offset-2"
              >
                Join
              </Link>{" "}
              with this session code on this device, or the same Join link you
              used before, so your player id is saved.
            </p>
          </StatusBanner>
        ) : null}
        <Link href="/" className={ui.linkBack}>
          ← Home
        </Link>
      </main>
    );
  }

  const phase = roomState.phase;
  const isLobby = phase === "lobby";
  const isBoardPhase =
    phase === "board" || phase === "clue_open" || phase === "judging";
  const isGameOver = phase === "game_over";

  const sortedLobbyPlayers = sortLobbyRosterByJoinOrder(roomState.players);
  const hostIdStored = readStoredId(STORAGE_KEYS.hostId);
  const canHostStart =
    role === "host" &&
    wsReady &&
    isLobby &&
    hostIdStored !== null &&
    hostIdStored === roomState.hostId;

  const hostCanSelectClues =
    role === "host" &&
    wsReady &&
    phase === "board" &&
    hostIdStored !== null &&
    hostIdStored === roomState.hostId;

  const boardCaption =
    role === "host" && hostCanSelectClues
      ? "Click a dollar amount to open that clue."
      : role === "host"
        ? "You can open clues when the session is on the board phase."
        : "Watch the board — the host will open clues.";

  const openClue =
    roomState.board && roomState.currentClueId
      ? getClueById(roomState.board, roomState.currentClueId)
      : null;

  const playerIdStored = readStoredId(STORAGE_KEYS.playerId);
  const isCluePhase = phase === "clue_open" || phase === "judging";

  const playerBuzzEligible =
    role === "player" &&
    wsReady &&
    phase === "clue_open" &&
    roomState.buzzOpen &&
    roomState.buzzWinnerPlayerId === null &&
    playerIdStored !== null;

  const isAuthoritativeHost =
    role === "host" &&
    wsReady &&
    hostIdStored !== null &&
    hostIdStored === roomState.hostId;

  const hostCanMarkJudgment =
    isAuthoritativeHost &&
    phase === "judging" &&
    roomState.buzzWinnerPlayerId !== null;

  const hostCanReopenBuzz =
    isAuthoritativeHost &&
    phase === "judging" &&
    roomState.buzzWinnerPlayerId === null &&
    roomState.currentClueId !== null;

  const hostCanCloseClue =
    isAuthoritativeHost &&
    (phase === "clue_open" || phase === "judging") &&
    roomState.currentClueId !== null;

  const hostCanEndGame =
    isAuthoritativeHost &&
    (phase === "board" || phase === "clue_open" || phase === "judging");

  const noHostGameYet =
    role === "host" && roomState.hostId === null && roomState.board === null;

  const playerNotOnRoster =
    role === "player" &&
    playerIdStored !== null &&
    !roomState.players.some((p) => p.id === playerIdStored);

  const showDisconnectedBanner =
    !wsReady && hasReceivedLiveState && roomState !== null;

  return (
    <main className={`${ui.page} ${ui.pageGame} ${ui.stack}`}>
      <header className={`${ui.surfaceHeader} space-y-2`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              {role === "host" ? "Host" : "Player"} view
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              {phaseTitle(phase)}
            </h1>
          </div>
          <span className="shrink-0 rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
            {phase}
          </span>
        </div>
        <p className="font-mono text-sm text-zinc-700 dark:text-zinc-300">
          Session: {sessionCode}
        </p>
        {!wsReady && !hasReceivedLiveState ? (
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Connecting…
          </p>
        ) : null}
      </header>

      {showDisconnectedBanner ? (
        <StatusBanner variant="warning" title="Disconnected from realtime">
          <p>
            The WebSocket to PartyKit closed. Refresh the page to reconnect.
            What you see below is the last state synced to this browser.
          </p>
        </StatusBanner>
      ) : null}

      {noHostGameYet ? (
        <StatusBanner variant="warning" title="No game at this session code">
          <p>
            This room has not been created yet. Open{" "}
            <Link
              href="/host"
              className="font-medium underline underline-offset-2"
            >
              Host
            </Link>{" "}
            to create a session, or confirm the session code matches the host’s
            link.
          </p>
        </StatusBanner>
      ) : null}

      {playerNotOnRoster ? (
        <StatusBanner variant="warning" title="Not on the player roster">
          <p>
            This browser is not registered for this game. Use{" "}
            <Link
              href="/join"
              className="font-medium underline underline-offset-2"
            >
              Join
            </Link>{" "}
            with session code{" "}
            <span className="font-mono font-medium">{sessionCode}</span> first,
            or use the same device you joined from.
          </p>
        </StatusBanner>
      ) : null}

      {actionError ? (
        <StatusBanner variant="error" title="Action rejected">
          <p>{actionError}</p>
        </StatusBanner>
      ) : null}

      {hostCanEndGame ? (
        <div
          className={`${ui.surfacePanel} flex flex-col gap-3 border-amber-200/80 bg-amber-50/50 dark:border-amber-900/40 dark:bg-amber-950/20`}
        >
          <p className="text-sm text-zinc-700 dark:text-zinc-300">
            End the session for everyone (unfinished clues stay unanswered).
          </p>
          <button
            type="button"
            onClick={handleEndGame}
            className={`${ui.btnDanger} self-start`}
          >
            End game for all
          </button>
        </div>
      ) : null}

      {isLobby ? (
        <>
          {role === "host" ? (
            <section
              className={`${ui.surfacePanel} space-y-4`}
              aria-labelledby="host-lobby-heading"
            >
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
                className={ui.btnPrimary}
              >
                Start game
              </button>
            </section>
          ) : (
            <section
              className={`${ui.surfacePanel} space-y-2`}
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
              <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 shadow-sm dark:divide-zinc-700 dark:border-zinc-700">
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
            {isCluePhase && openClue ? (
              <ClueView
                phase={phase === "judging" ? "judging" : "clue_open"}
                viewRole={role}
                clue={{
                  value: openClue.value,
                  question: openClue.question,
                  answer: role === "host" ? openClue.answer : "",
                }}
                players={roomState.players}
                buzzOpen={roomState.buzzOpen}
                buzzWinnerPlayerId={roomState.buzzWinnerPlayerId}
                selfPlayerId={playerIdStored}
                buzzEligible={playerBuzzEligible}
                onBuzz={playerBuzzEligible ? handleBuzz : undefined}
                onHostMarkCorrect={
                  hostCanMarkJudgment ? handleHostMarkCorrect : undefined
                }
                onHostMarkIncorrect={
                  hostCanMarkJudgment ? handleHostMarkIncorrect : undefined
                }
                onHostReopenBuzz={
                  hostCanReopenBuzz ? handleHostReopenBuzz : undefined
                }
                onHostCloseClue={
                  hostCanCloseClue ? handleHostCloseClue : undefined
                }
              />
            ) : null}
            {isCluePhase && !openClue ? (
              <StatusBanner variant="error" title="Clue data missing">
                <p>
                  {roomState.currentClueId
                    ? "The active clue id does not match any clue on the board. The session may be out of sync — try refreshing."
                    : "The game is in a clue phase but no clue is selected."}
                </p>
              </StatusBanner>
            ) : null}
            {roomState.board ? (
              <GameBoardGrid
                board={roomState.board}
                answeredClueIds={roomState.answeredClueIds}
                currentClueId={roomState.currentClueId}
                phase={phase}
                hostCanSelectClues={hostCanSelectClues}
                onHostSelectClue={
                  hostCanSelectClues ? handleHostOpenClue : undefined
                }
                caption={boardCaption}
              />
            ) : (
              <StatusBanner variant="error" title="No board in session">
                <p>
                  The server state has no board loaded. If you are the host,
                  this session may need to be recreated from{" "}
                  <Link
                    href="/host"
                    className="font-medium underline underline-offset-2"
                  >
                    Host
                  </Link>
                  .
                </p>
              </StatusBanner>
            )}
          </div>
          {phase === "board" ? (
            <aside className="w-full shrink-0 lg:w-64">
              <GameScoreboard players={roomState.players} showConnection />
            </aside>
          ) : null}
        </div>
      ) : null}

      {isGameOver ? (
        <EndGameLeaderboard rankings={rankPlayers(roomState.players)} />
      ) : null}

      <Link href="/" className={ui.linkBack}>
        ← Home
      </Link>
    </main>
  );
}
