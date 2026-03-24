"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { ClueView } from "@/components/ClueView";
import { EndGameLeaderboard } from "@/components/game/EndGameLeaderboard";
import { GameArchivistShell } from "@/components/game/GameArchivistShell";
import { GameBoardArchivistFooter } from "@/components/game/GameBoardArchivistFooter";
import { GameBoardGrid } from "@/components/game/GameBoardGrid";
import type { GamePlayTab } from "@/components/game/GamePlayShell";
import { LiveLeaderboard } from "@/components/game/LiveLeaderboard";
import { StandingPodium } from "@/components/game/StandingPodium";
import { StatusBanner } from "@/components/ui/StatusBanner";
import { readStoredId, STORAGE_KEYS } from "@/lib/ids";
import type { RoomState } from "@/types/game";
import type { ClientMessage } from "@/types/messages";

import { getCategoryNameForClueId, getClueById } from "@/lib/board-clue";
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
  /** Avoid reading localStorage during SSR; identity warnings only after mount. */
  const [hasHydrated, setHasHydrated] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const roomStateRef = useRef<RoomState | null>(null);
  /** Mirrors `hasReceivedLiveState` for `onclose` (avoids stale closures). */
  const receivedLiveStateRef = useRef(false);
  const [playTab, setPlayTab] = useState<GamePlayTab>("board");

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setHasHydrated(true);
    });
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    roomStateRef.current = roomState;
  }, [roomState]);

  /** When a clue opens, bring players back to the Board tab so they see the clue. */
  useEffect(() => {
    if (roomState?.phase === "clue_open" || roomState?.phase === "judging") {
      const id = requestAnimationFrame(() => setPlayTab("board"));
      return () => cancelAnimationFrame(id);
    }
  }, [roomState?.phase]);

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

  const missingHostIdentity =
    hasHydrated &&
    role === "host" &&
    readStoredId(STORAGE_KEYS.hostId) === null;
  const missingPlayerIdentity =
    hasHydrated &&
    role === "player" &&
    readStoredId(STORAGE_KEYS.playerId) === null;

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

  const categoryName = getCategoryNameForClueId(
    roomState.board,
    roomState.currentClueId,
  );

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

  const pageWidthClass = isGameOver
    ? ui.pageGameFinale
    : isBoardPhase
      ? ui.pageGameWide
      : ui.pageGame;

  return (
    <main
      className={
        isBoardPhase
          ? "font-archivist flex min-h-screen w-full max-w-none flex-col bg-archivist-cream text-archivist-ink"
          : `${ui.page} ${pageWidthClass} ${ui.stack}`
      }
    >
      {!isBoardPhase ? (
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
            <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
              {hostCanEndGame ? (
                <button
                  type="button"
                  onClick={handleEndGame}
                  title="Ends the session for everyone. Unplayed clues stay on the board."
                  className={`${ui.btnDanger} whitespace-nowrap`}
                >
                  End game
                </button>
              ) : null}
              <span className="shrink-0 rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
                {phase}
              </span>
            </div>
          </div>
          {!isLobby ? (
            <p className="font-mono text-sm text-zinc-700 dark:text-zinc-300">
              Session: {sessionCode}
            </p>
          ) : null}
          {!wsReady && !hasReceivedLiveState ? (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Connecting…
            </p>
          ) : null}
        </header>
      ) : null}

      {showDisconnectedBanner ? (
        <div className={isBoardPhase ? "px-4 pt-3 md:px-6" : ""}>
          <StatusBanner variant="warning" title="Disconnected from realtime">
            <p>
              The WebSocket to PartyKit closed. Refresh the page to reconnect.
              What you see below is the last state synced to this browser.
            </p>
          </StatusBanner>
        </div>
      ) : null}

      {noHostGameYet ? (
        <div className={isBoardPhase ? "px-4 md:px-6" : ""}>
          <StatusBanner variant="warning" title="No game at this session code">
            <p>
              This room has not been created yet. Open{" "}
              <Link
                href="/host"
                className="font-medium underline underline-offset-2"
              >
                Host
              </Link>{" "}
              to create a session, or confirm the session code matches the
              host’s link.
            </p>
          </StatusBanner>
        </div>
      ) : null}

      {playerNotOnRoster ? (
        <div className={isBoardPhase ? "px-4 md:px-6" : ""}>
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
              <span className="font-mono font-medium">{sessionCode}</span>{" "}
              first, or use the same device you joined from.
            </p>
          </StatusBanner>
        </div>
      ) : null}

      {actionError ? (
        <div className={isBoardPhase ? "px-4 md:px-6" : ""}>
          <StatusBanner variant="error" title="Action rejected">
            <p>{actionError}</p>
          </StatusBanner>
        </div>
      ) : null}

      {isLobby ? (
        <div className="flex flex-col gap-6">
          <section
            aria-labelledby="lobby-waiting-heading"
            className={`${ui.surfacePanel} border-zinc-300/90 bg-gradient-to-b from-zinc-50 to-white p-5 dark:border-zinc-600 dark:from-zinc-900/50 dark:to-zinc-950/40 sm:p-6`}
          >
            <p className={ui.eyebrow}>Waiting room</p>
            <h2
              id="lobby-waiting-heading"
              className="mt-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50"
            >
              {role === "host" ? "You’re hosting" : "You’re in the lobby"}
            </h2>
            <p className={`${ui.helper} mt-1`}>
              {role === "host"
                ? "Share the code so up to six contestants can join from the Join page."
                : "The host will open the board when everyone who’s playing has joined."}
            </p>

            <div className="mt-5 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Session code
              </p>
              <p
                className="select-all font-mono text-3xl font-bold tracking-[0.2em] text-zinc-900 sm:text-4xl dark:text-zinc-50"
                aria-label={`Session code ${sessionCode.split("").join(" ")}`}
              >
                {sessionCode}
              </p>
            </div>

            {roomState.board?.title ? (
              <p className="mt-4 text-sm text-zinc-700 dark:text-zinc-300">
                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                  Board:
                </span>{" "}
                {roomState.board.title}
              </p>
            ) : null}

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-zinc-300 bg-white px-2.5 py-1 text-xs font-semibold text-zinc-800 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200">
                {role === "host" ? "Host" : "Contestant"}
              </span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                {role === "host"
                  ? "You control clues and scoring."
                  : "You’ll buzz in when clues open."}
              </span>
            </div>
          </section>

          <section
            aria-labelledby="roster-heading"
            className={`${ui.surfacePanel} space-y-3`}
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 id="roster-heading" className={ui.sectionTitle}>
                Contestants
              </h2>
              <span className="font-mono text-xs font-medium text-zinc-500 dark:text-zinc-400">
                {sortedLobbyPlayers.length} / 6
              </span>
            </div>
            <p className={ui.helper}>
              Join order is shown; up to six players can be in this game.
            </p>
            {sortedLobbyPlayers.length === 0 ? (
              <p className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-4 py-6 text-center text-sm text-zinc-600 dark:border-zinc-600 dark:bg-zinc-900/30 dark:text-zinc-400">
                No contestants yet. Share the session code so people can join.
              </p>
            ) : (
              <ul className="space-y-2">
                {sortedLobbyPlayers.map((p, rosterIndex) => {
                  const isSelf =
                    role === "player" &&
                    playerIdStored !== null &&
                    p.id === playerIdStored;
                  return (
                    <li
                      key={p.id}
                      className="flex min-h-[3rem] items-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50/80 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900/40 sm:px-4"
                    >
                      <span
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-zinc-200/90 font-mono text-xs font-bold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                        aria-hidden
                      >
                        {rosterIndex + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="truncate font-medium text-zinc-900 dark:text-zinc-100">
                            {p.name}
                          </span>
                          {isSelf ? (
                            <span className="shrink-0 rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-900 dark:bg-blue-950/80 dark:text-blue-200">
                              You
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <span
                        className={
                          p.connected
                            ? "shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300"
                            : "shrink-0 rounded-full bg-zinc-200 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300"
                        }
                      >
                        {p.connected ? "Here" : "Away"}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {role === "host" ? (
            <section
              className={`${ui.surfacePanel} space-y-4 border-zinc-900/10 bg-zinc-900/[0.03] dark:border-zinc-100/10 dark:bg-zinc-100/[0.04]`}
              aria-labelledby="host-lobby-heading"
            >
              <h2 id="host-lobby-heading" className={ui.sectionTitle}>
                Start the game
              </h2>
              <p className="text-sm text-zinc-700 dark:text-zinc-300">
                When your group is ready, open the board for everyone. You can
                start with any number of contestants (up to six).
              </p>
              {roomState.board?.title ? (
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  <span className="font-medium text-zinc-800 dark:text-zinc-200">
                    Board in play:
                  </span>{" "}
                  {roomState.board.title}
                </p>
              ) : null}
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
                className={`${ui.btnPrimary} w-full max-w-md py-3 text-base`}
              >
                Start game
              </button>
            </section>
          ) : (
            <section
              className={`${ui.surfacePanel} space-y-3 border-blue-200/60 bg-blue-50/40 dark:border-blue-900/40 dark:bg-blue-950/25`}
              aria-labelledby="player-wait-heading"
            >
              <h2
                id="player-wait-heading"
                className="text-base font-semibold text-zinc-900 dark:text-zinc-100"
              >
                Waiting for the host
              </h2>
              <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                Stay on this page. When the host starts, the game board will
                appear here.
              </p>
            </section>
          )}
        </div>
      ) : null}

      {isBoardPhase ? (
        <GameArchivistShell
          tab={playTab}
          onTabChange={setPlayTab}
          shellMode={isCluePhase ? "clue" : "board"}
          categoryName={categoryName}
          statusSubtitle={roomState.board?.title ?? null}
          phaseBadge={phase}
          hostCanEndGame={hostCanEndGame}
          onEndGame={handleEndGame}
          connecting={!wsReady && !hasReceivedLiveState}
          sidebarFooterBoard={<StandingPodium players={roomState.players} />}
        >
          {playTab === "board" ? (
            <div className="space-y-8 md:space-y-10">
              {isCluePhase && openClue ? (
                <ClueView
                  phase={phase === "judging" ? "judging" : "clue_open"}
                  viewRole={role}
                  categoryName={categoryName}
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
                  showInlineScoreboard={false}
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
              {phase === "board" && roomState.board ? (
                <>
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
                  <GameBoardArchivistFooter sessionCode={sessionCode} />
                </>
              ) : null}
              {phase === "board" && !roomState.board ? (
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
              ) : null}
            </div>
          ) : (
            <div className="mx-auto max-w-2xl rounded-sm border border-archivist-outline-variant/20 bg-archivist-surface-lowest p-5 shadow-sm md:p-6">
              <LiveLeaderboard
                players={roomState.players}
                selfPlayerId={role === "player" ? playerIdStored : null}
              />
            </div>
          )}
        </GameArchivistShell>
      ) : null}

      {isGameOver ? (
        <div className="w-full pt-4">
          <EndGameLeaderboard rankings={rankPlayers(roomState.players)} />
        </div>
      ) : null}

      {!isBoardPhase ? (
        <Link href="/" className={ui.linkBack}>
          ← Home
        </Link>
      ) : null}
    </main>
  );
}
