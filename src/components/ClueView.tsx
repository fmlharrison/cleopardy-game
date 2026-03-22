"use client";

import { GameScoreboard } from "@/components/game/GameScoreboard";
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
  if (phase === "judging") {
    return "Buzzing is closed — the host is judging.";
  }
  const winnerName = playerName(players, buzzWinnerPlayerId);
  if (winnerName) {
    return `${winnerName} buzzed in first.`;
  }
  if (buzzOpen) {
    return "Buzzing is open — first correct buzz locks in.";
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
      return "Judging — use Correct or Incorrect when ready.";
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

  return (
    <section
      aria-labelledby="clue-view-heading"
      className="rounded-lg border border-zinc-200 bg-zinc-50/80 p-4 dark:border-zinc-700 dark:bg-zinc-900/40"
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1 space-y-4">
          <div className="space-y-1">
            <h2
              id="clue-view-heading"
              className="text-sm font-semibold text-zinc-800 dark:text-zinc-200"
            >
              Clue
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Phase:{" "}
              <span className="font-mono">
                {phase === "clue_open" ? "clue open" : "judging"}
              </span>
            </p>
          </div>

          {clue ? (
            <div className="space-y-3">
              <p className="text-2xl font-bold tabular-nums text-amber-700 dark:text-amber-400">
                ${clue.value}
              </p>
              <p className="text-base leading-relaxed text-zinc-900 dark:text-zinc-100">
                {clue.question}
              </p>
              {viewRole === "host" ? (
                <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 dark:border-emerald-900/50 dark:bg-emerald-950/40">
                  <p className="text-xs font-medium uppercase tracking-wide text-emerald-800 dark:text-emerald-300">
                    Host — accepted answer
                  </p>
                  <p className="mt-1 text-sm font-medium text-emerald-950 dark:text-emerald-100">
                    {clue.answer}
                  </p>
                </div>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-red-700 dark:text-red-300" role="alert">
              Clue data is missing.
            </p>
          )}

          <div
            className="rounded-md border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950/60"
            role="status"
            aria-live="polite"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Buzz status
            </p>
            <p className="mt-1 text-sm text-zinc-800 dark:text-zinc-200">
              {buzzSummaryLine(phase, buzzOpen, buzzWinnerPlayerId, players)}
            </p>
            {viewRole === "host" ? (
              <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
                {hostBuzzMessage}
              </p>
            ) : (
              <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
                {playerStatusMessage}
              </p>
            )}
          </div>

          {viewRole === "player" ? (
            <div className="space-y-2">
              <button
                type="button"
                disabled={buzzButtonDisabled}
                onClick={() => onBuzz?.()}
                className="w-full rounded-xl bg-amber-500 px-4 py-4 text-lg font-bold tracking-wide text-amber-950 shadow-sm transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-amber-600 dark:text-amber-50 dark:hover:bg-amber-500"
              >
                Buzz
              </button>
              <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">
                {buzzButtonDisabled
                  ? phase === "judging"
                    ? "Buzz is off while the host judges."
                    : buzzWinnerPlayerId
                      ? "Someone already buzzed in."
                      : !buzzOpen
                        ? "Buzz is closed."
                        : "You can’t buzz right now."
                  : onBuzz
                    ? "Tap when you’re ready to answer."
                    : "Buzz will be wired to the server next."}
              </p>
            </div>
          ) : null}

          {viewRole === "host" ? (
            <div className="space-y-2 rounded-md border border-dashed border-zinc-300 bg-white/60 p-3 dark:border-zinc-600 dark:bg-zinc-950/40">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Host controls
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={!onHostMarkCorrect}
                  onClick={onHostMarkCorrect}
                  className="rounded-md bg-emerald-700 px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40 dark:bg-emerald-600"
                >
                  Correct
                </button>
                <button
                  type="button"
                  disabled={!onHostMarkIncorrect}
                  onClick={onHostMarkIncorrect}
                  className="rounded-md bg-red-700 px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40 dark:bg-red-600"
                >
                  Incorrect
                </button>
                <button
                  type="button"
                  disabled={!onHostReopenBuzz}
                  onClick={onHostReopenBuzz}
                  className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-900 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-600 dark:bg-zinc-200 dark:text-zinc-900"
                >
                  Reopen buzz
                </button>
                <button
                  type="button"
                  disabled={!onHostCloseClue}
                  onClick={onHostCloseClue}
                  className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900"
                >
                  Close clue
                </button>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Actions will send server messages once wired.
              </p>
            </div>
          ) : null}
        </div>

        <aside className="w-full shrink-0 lg:w-56">
          <GameScoreboard players={players} showConnection />
        </aside>
      </div>
    </section>
  );
}
