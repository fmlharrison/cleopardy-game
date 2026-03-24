"use client";

import { GameScoreboard } from "@/components/game/GameScoreboard";
import { ui } from "@/lib/ui";
import type { Player } from "@/types/game";

/** Active clue copy; `answer` is only rendered when `viewRole === "host"`. */
export type ClueViewClue = {
  value: number;
  question: string;
  answer: string;
};

export type ClueViewProps = {
  phase: "clue_open" | "judging";
  viewRole: "host" | "player";
  clue: ClueViewClue | null;
  players: Player[];
  buzzOpen: boolean;
  buzzWinnerPlayerId: string | null;
  /** Joined player’s id — used for “you” vs others in buzz copy. */
  selfPlayerId?: string | null;
  /** Player may ring in (typically buzzOpen && !buzzWinner && connected player). */
  buzzEligible: boolean;
  onBuzz?: () => void;
  /** Host-only; omit to show disabled controls until server wiring exists. */
  onHostMarkCorrect?: () => void;
  onHostMarkIncorrect?: () => void;
  onHostReopenBuzz?: () => void;
  onHostCloseClue?: () => void;
};

function playerName(players: Player[], id: string | null): string | null {
  if (!id) {
    return null;
  }
  return players.find((p) => p.id === id)?.name ?? null;
}

function buzzSummaryLine(
  phase: "clue_open" | "judging",
  buzzOpen: boolean,
  buzzWinnerPlayerId: string | null,
  players: Player[],
): string {
  const winnerName = playerName(players, buzzWinnerPlayerId);
  if (phase === "judging") {
    return winnerName
      ? `${winnerName} buzzed in first. The host is judging their answer.`
      : "The host is judging.";
  }
  if (winnerName) {
    return `${winnerName} buzzed in first.`;
  }
  if (buzzOpen) {
    return "Buzzing is open — first buzz on the server wins.";
  }
  return "Buzzing is closed.";
}

export function ClueView({
  phase,
  viewRole,
  clue,
  players,
  buzzOpen,
  buzzWinnerPlayerId,
  selfPlayerId = null,
  buzzEligible,
  onBuzz,
  onHostMarkCorrect,
  onHostMarkIncorrect,
  onHostReopenBuzz,
  onHostCloseClue,
}: ClueViewProps) {
  const winnerName = playerName(players, buzzWinnerPlayerId);
  const isSelfWinner =
    Boolean(buzzWinnerPlayerId) && buzzWinnerPlayerId === selfPlayerId;

  const buzzStateLabel =
    phase === "judging" ? "Judging" : buzzOpen ? "Buzz open" : "Buzz closed";

  const momentHeadline =
    phase === "judging"
      ? "Judging this response"
      : winnerName
        ? "Buzz locked"
        : buzzOpen
          ? "Open for buzz"
          : "Buzz closed";

  const playerStatusMessage = (() => {
    if (phase === "judging") {
      return "The host is judging the answer.";
    }
    if (winnerName) {
      return isSelfWinner
        ? "You buzzed in first — wait for the host."
        : `${winnerName} buzzed in first.`;
    }
    if (buzzOpen) {
      return "Ring in if you know the answer.";
    }
    return "Buzzing is closed for this clue.";
  })();

  const hostBuzzMessage = (() => {
    if (phase === "judging") {
      return "Use Correct or Incorrect when ready.";
    }
    if (winnerName) {
      return `${winnerName} has the floor.`;
    }
    if (buzzOpen) {
      return "Waiting for someone to buzz…";
    }
    return "Buzz window is closed.";
  })();

  const buzzButtonDisabled = !buzzEligible;

  const momentPanelClass =
    phase === "judging"
      ? "border-t-2 border-blue-500/50 bg-blue-950/40 dark:border-blue-400/50 dark:bg-blue-950/50"
      : winnerName
        ? "border-t-2 border-amber-500/70 bg-amber-950/35 dark:border-amber-400/60 dark:bg-amber-950/40"
        : buzzOpen
          ? "border-t-2 border-emerald-500/45 bg-emerald-950/30 dark:border-emerald-500/50 dark:bg-emerald-950/35"
          : "border-t-2 border-zinc-600/50 bg-zinc-900/50 dark:border-zinc-600 dark:bg-zinc-950/60";

  return (
    <section
      aria-labelledby="clue-view-heading"
      className="overflow-hidden rounded-2xl border-2 border-zinc-300 shadow-lg dark:border-zinc-600"
    >
      <div className="flex flex-col gap-0 lg:flex-row lg:items-stretch">
        <div className="min-w-0 flex-1">
          {/* Clue hero — main event */}
          {clue ? (
            <div className="bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-5 pb-8 pt-6 text-white sm:px-8 sm:pb-10 sm:pt-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p
                  id="clue-view-heading"
                  className="text-[11px] font-bold uppercase tracking-[0.25em] text-amber-400/90"
                >
                  Live clue
                </p>
                <span className="rounded-md border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-zinc-200">
                  {buzzStateLabel}
                </span>
              </div>

              <div className="mt-6 flex flex-wrap items-end gap-4 gap-y-2">
                <p
                  className="text-5xl font-black tabular-nums tracking-tight text-amber-400 sm:text-6xl"
                  aria-label={`Clue value ${clue.value} dollars`}
                >
                  ${clue.value}
                </p>
              </div>

              <p className="mt-6 text-pretty text-xl font-medium leading-snug text-zinc-100 sm:text-2xl sm:leading-tight">
                {clue.question}
              </p>

              {viewRole === "host" ? (
                <div className="mt-8 rounded-xl border border-emerald-500/40 bg-emerald-950/50 px-4 py-3 sm:px-5 sm:py-4">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-300/90">
                    Answer (host only)
                  </p>
                  <p className="mt-2 text-lg font-semibold leading-snug text-emerald-50">
                    {clue.answer}
                  </p>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="bg-slate-950 px-5 py-8 sm:px-8">
              <p className="text-sm text-red-300" role="alert">
                Clue data is missing.
              </p>
            </div>
          )}

          {/* Single moment / status strip */}
          <div
            className={`px-5 py-4 sm:px-8 ${momentPanelClass}`}
            role="status"
            aria-live="polite"
          >
            <p className="text-xs font-bold uppercase tracking-wide text-zinc-200">
              {momentHeadline}
            </p>
            {winnerName && buzzWinnerPlayerId ? (
              <p className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                {winnerName}
                {isSelfWinner && viewRole === "player" ? (
                  <span className="ml-2 text-lg font-semibold text-amber-300">
                    (you)
                  </span>
                ) : null}
              </p>
            ) : null}
            <p className="mt-2 text-sm leading-relaxed text-zinc-300">
              {buzzSummaryLine(phase, buzzOpen, buzzWinnerPlayerId, players)}
            </p>
            <p className="mt-2 text-sm text-zinc-400">
              {viewRole === "host" ? hostBuzzMessage : playerStatusMessage}
            </p>
          </div>

          {/* Player buzz — primary action */}
          {viewRole === "player" ? (
            <div className="space-y-3 bg-zinc-100 px-5 py-6 dark:bg-zinc-900/80 sm:px-8">
              <button
                type="button"
                disabled={buzzButtonDisabled}
                onClick={() => onBuzz?.()}
                className={`w-full rounded-2xl border-4 border-transparent px-6 py-5 text-xl font-black uppercase tracking-widest transition-colors sm:text-2xl ${
                  buzzButtonDisabled
                    ? "cursor-not-allowed bg-zinc-300 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-600"
                    : "bg-amber-500 text-amber-950 shadow-xl ring-4 ring-amber-400/50 hover:bg-amber-400 dark:bg-amber-500 dark:text-amber-950 dark:hover:bg-amber-400"
                }`}
              >
                Buzz
              </button>
              <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
                {buzzButtonDisabled
                  ? phase === "judging"
                    ? "Buzz is off while the host judges."
                    : buzzWinnerPlayerId
                      ? "Someone already buzzed in."
                      : !buzzOpen
                        ? "Buzz is closed for this clue."
                        : "You can’t buzz right now."
                  : onBuzz
                    ? "Tap when you’re ready to answer out loud."
                    : "Buzz will be wired to the server next."}
              </p>
            </div>
          ) : null}

          {/* Host console — visually separated */}
          {viewRole === "host" ? (
            <div className="border-t-4 border-amber-500 bg-amber-50/90 px-5 py-5 dark:border-amber-600 dark:bg-amber-950/30 sm:px-8">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-900 dark:text-amber-200">
                Host console
              </p>
              <p className="mt-1 text-sm text-amber-950/80 dark:text-amber-100/80">
                Run the clue: mark the response, reopen buzz if needed, or close
                the clue.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={!onHostMarkCorrect}
                  onClick={onHostMarkCorrect}
                  className="rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40 dark:bg-emerald-600"
                >
                  Correct
                </button>
                <button
                  type="button"
                  disabled={!onHostMarkIncorrect}
                  onClick={onHostMarkIncorrect}
                  className="rounded-lg bg-red-700 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40 dark:bg-red-600"
                >
                  Incorrect
                </button>
                <button
                  type="button"
                  disabled={!onHostReopenBuzz}
                  onClick={onHostReopenBuzz}
                  className="rounded-lg border-2 border-zinc-400 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-900 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-500 dark:bg-zinc-900 dark:text-zinc-100"
                >
                  Reopen buzz
                </button>
                <button
                  type="button"
                  disabled={!onHostCloseClue}
                  onClick={onHostCloseClue}
                  className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900"
                >
                  Close clue
                </button>
              </div>
              <p
                className={`${ui.helper} mt-3 text-amber-900/70 dark:text-amber-200/70`}
              >
                The server validates each action; errors appear above.
              </p>
            </div>
          ) : null}
        </div>

        <aside className="w-full shrink-0 border-t border-zinc-300 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-950/50 lg:w-72 lg:border-l lg:border-t-0 lg:p-5">
          <GameScoreboard
            players={players}
            showConnection
            emphasizePlayerId={buzzWinnerPlayerId}
          />
        </aside>
      </div>
    </section>
  );
}
