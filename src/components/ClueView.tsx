"use client";

import { useEffect, useMemo } from "react";

import {
  MdElectricBolt,
  MdGavel,
  MdOutlineLock,
  MdOutlineMic,
  MdSensors,
} from "@/components/icons/md";
import type { Player } from "@/types/game";

/** Active clue copy; `answer` is only rendered for `viewRole === "host"`. */
export type ClueViewClue = {
  value: number;
  question: string;
  answer: string;
};

export type ClueViewProps = {
  phase: "clue_open" | "judging";
  viewRole: "host" | "player" | "spectator";
  clue: ClueViewClue | null;
  /** Category title for the active clue (sidebar + card header). */
  categoryName?: string | null;
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
  /**
   * When false, omit the right-rail scoreboard (e.g. game shell has a Leaderboard tab).
   * @default true
   */
  showInlineScoreboard?: boolean;
};

function playerName(players: Player[], id: string | null): string | null {
  if (!id) {
    return null;
  }
  return players.find((p) => p.id === id)?.name ?? null;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "?";
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function isEditableTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) {
    return false;
  }
  const tag = el.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
    return true;
  }
  return el.isContentEditable;
}

const btnCleopardy =
  "rounded-sm px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40";

export function ClueView({
  phase,
  viewRole,
  clue,
  categoryName = null,
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
  showInlineScoreboard = true,
}: ClueViewProps) {
  void showInlineScoreboard;
  const winnerName = playerName(players, buzzWinnerPlayerId);

  useEffect(() => {
    if (viewRole !== "player" || !buzzEligible || !onBuzz) {
      return;
    }
    const onKeyDown = (ev: KeyboardEvent) => {
      if (ev.key !== " ") {
        return;
      }
      if (isEditableTarget(ev.target)) {
        return;
      }
      ev.preventDefault();
      onBuzz();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [viewRole, buzzEligible, onBuzz]);

  const buzzButtonDisabled = !buzzEligible;

  const sortedForCards = useMemo(() => {
    const list = [...players].sort((a, b) => {
      if (buzzWinnerPlayerId) {
        if (a.id === buzzWinnerPlayerId) {
          return -1;
        }
        if (b.id === buzzWinnerPlayerId) {
          return 1;
        }
      }
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return a.joinOrder - b.joinOrder;
    });
    return list;
  }, [players, buzzWinnerPlayerId]);

  const statusPill = (() => {
    if (phase === "judging") {
      return (
        <div className="inline-flex items-center gap-2 rounded-full border border-archivist-cream/10 bg-archivist-primary-container px-6 py-2 text-archivist-cream shadow-lg">
          <MdGavel
            className="h-4 w-4 shrink-0 text-archivist-cream"
            aria-hidden
          />
          <span className="text-xs font-bold uppercase tracking-[0.2em]">
            Host judging
          </span>
        </div>
      );
    }
    if (winnerName && buzzWinnerPlayerId) {
      const ini = initials(winnerName);
      return (
        <div
          className="inline-flex items-center gap-2 rounded-full border border-archivist-cream/10 bg-archivist-primary-container px-6 py-2 text-archivist-cream shadow-lg"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          <MdElectricBolt
            className="h-4 w-4 shrink-0 text-archivist-cream"
            aria-hidden
          />
          <span className="text-xs font-bold uppercase tracking-[0.2em]">
            {ini} buzzed in first!
          </span>
        </div>
      );
    }
    if (buzzOpen) {
      return (
        <div className="inline-flex items-center gap-2 rounded-full border border-archivist-outline-variant/30 bg-archivist-surface-lowest px-6 py-2 text-archivist-ink shadow-sm">
          <MdOutlineMic className="h-4 w-4 shrink-0" aria-hidden />
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-archivist-accent">
            Open for buzz
          </span>
        </div>
      );
    }
    return (
      <div className="inline-flex items-center gap-2 rounded-full border border-archivist-outline-variant/30 bg-archivist-surface-highest px-6 py-2 text-archivist-on-surface-variant shadow-sm">
        <MdOutlineLock className="h-4 w-4 shrink-0" aria-hidden />
        <span className="text-xs font-bold uppercase tracking-[0.2em]">
          Buzz closed
        </span>
      </div>
    );
  })();

  const categoryLine = categoryName ?? "Category";

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col items-center">
      <div className="mb-10 text-center md:mb-12">{statusPill}</div>

      <div className="w-full space-y-10 md:space-y-12">
        {clue ? (
          <>
            <div className="relative">
              <div
                className="absolute inset-0 -rotate-1 translate-x-2 translate-y-2 rounded-sm bg-archivist-tertiary opacity-5"
                aria-hidden
              />
              <div className="relative flex flex-col items-center border border-archivist-outline-variant/10 bg-archivist-surface-lowest px-6 py-10 text-center shadow-sm md:p-16 md:px-12 md:py-20">
                <div className="absolute left-0 right-0 top-6 flex justify-between px-6 text-[10px] font-medium uppercase tracking-widest text-archivist-accent md:px-12">
                  <span>Category: {categoryLine}</span>
                  <span>Value: ${clue.value}</span>
                </div>
                <h1 className="mt-10 max-w-2xl font-archivist text-3xl font-light leading-snug text-archivist-ink md:mt-8 md:text-5xl">
                  {clue.question}
                </h1>
                <div className="mt-8 flex flex-wrap justify-center gap-2 md:mt-12">
                  <span className="rounded-full bg-archivist-surface-high px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-archivist-on-surface-variant">
                    Live clue
                  </span>
                </div>
                {viewRole === "host" && clue.answer ? (
                  <div className="mt-8 w-full max-w-2xl rounded-sm border border-archivist-outline-variant/40 bg-archivist-container px-4 py-3 text-left">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-archivist-accent">
                      Answer (host only)
                    </p>
                    <p className="mt-2 text-base font-semibold leading-snug text-archivist-ink">
                      {clue.answer}
                    </p>
                  </div>
                ) : null}
                {viewRole === "spectator" ? (
                  <p className="mt-8 max-w-md text-center text-sm text-archivist-on-surface-variant">
                    Spectating — buzz and scoring are disabled on this view.
                  </p>
                ) : null}
              </div>
            </div>

            {viewRole === "player" ? (
              <div className="flex flex-col items-center space-y-6 py-4 md:space-y-8 md:py-8">
                <button
                  type="button"
                  disabled={buzzButtonDisabled}
                  onClick={() => onBuzz?.()}
                  className={`relative flex h-44 w-44 items-center justify-center overflow-hidden rounded-full border-8 border-archivist-cream bg-archivist-ink text-archivist-cream shadow-2xl transition-transform active:scale-95 md:h-48 md:w-48 ${
                    buzzButtonDisabled
                      ? "cursor-not-allowed opacity-50"
                      : "cursor-pointer"
                  }`}
                  aria-label="Buzz in"
                >
                  <div
                    className="absolute inset-0 bg-gradient-to-tr from-archivist-primary-container to-transparent opacity-50"
                    aria-hidden
                  />
                  <div className="relative flex flex-col items-center">
                    <span className="mb-1 text-3xl font-black tracking-tighter md:text-4xl">
                      BUZZ
                    </span>
                    <MdSensors
                      className="h-8 w-8 shrink-0 text-archivist-cream"
                      aria-hidden
                    />
                  </div>
                </button>
                <p className="text-center text-sm font-medium tracking-wide text-archivist-tertiary">
                  Click or press{" "}
                  <kbd className="rounded border border-archivist-outline-variant/40 bg-archivist-surface-highest px-2 py-1 text-xs font-bold">
                    SPACE
                  </kbd>{" "}
                  to interject
                </p>
                <p className="max-w-md text-center text-xs text-archivist-accent">
                  {buzzButtonDisabled
                    ? phase === "judging"
                      ? "Buzz is off while the host judges."
                      : buzzWinnerPlayerId
                        ? "Someone already buzzed in."
                        : !buzzOpen
                          ? "Buzz is closed for this clue."
                          : "You can’t buzz right now."
                    : "Ring in if you know the answer."}
                </p>
              </div>
            ) : null}

            <div className="grid grid-cols-1 gap-6 pt-4 md:grid-cols-3 md:gap-8 md:pt-8">
              {sortedForCards.map((p) => {
                const speaking =
                  buzzWinnerPlayerId !== null && p.id === buzzWinnerPlayerId;
                return (
                  <div
                    key={p.id}
                    className={`rounded-sm p-6 shadow-sm ${
                      speaking
                        ? "self-start border-l-4 border-archivist-tertiary bg-archivist-surface-lowest"
                        : "self-end bg-archivist-surface-low opacity-60 md:self-auto"
                    }`}
                  >
                    <div className="mb-4 flex items-start justify-between">
                      <span
                        className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${
                          speaking
                            ? "bg-archivist-tertiary text-archivist-cream"
                            : "bg-archivist-outline-variant text-archivist-on-surface"
                        }`}
                      >
                        {initials(p.name)}
                      </span>
                      <span
                        className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${
                          speaking
                            ? "bg-archivist-surface-high text-archivist-ink"
                            : "text-archivist-on-surface-variant"
                        }`}
                      >
                        {speaking ? "Speaking" : "Locked"}
                      </span>
                    </div>
                    <p className="mb-1 text-xs font-bold uppercase tracking-widest text-archivist-tertiary">
                      {p.name}
                      {selfPlayerId === p.id && viewRole === "player" ? (
                        <span className="ml-2 normal-case text-archivist-accent">
                          (you)
                        </span>
                      ) : null}
                    </p>
                    <p className="text-2xl font-bold tracking-tight text-archivist-ink">
                      ${p.score}
                    </p>
                  </div>
                );
              })}
            </div>

            {viewRole === "host" ? (
              <div className="border-t border-archivist-outline-variant/20 pt-8">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-archivist-accent">
                  Host console
                </p>
                <p className="mt-1 text-sm text-archivist-on-surface-variant">
                  Mark the response, reopen buzz if needed, or close the clue.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={!onHostMarkCorrect}
                    onClick={onHostMarkCorrect}
                    className={`${btnCleopardy} bg-archivist-primary-container text-archivist-cream hover:opacity-90`}
                  >
                    Correct
                  </button>
                  <button
                    type="button"
                    disabled={!onHostMarkIncorrect}
                    onClick={onHostMarkIncorrect}
                    className={`${btnCleopardy} border border-red-300 bg-white text-red-800 hover:bg-red-50`}
                  >
                    Incorrect
                  </button>
                  <button
                    type="button"
                    disabled={!onHostReopenBuzz}
                    onClick={onHostReopenBuzz}
                    className={`${btnCleopardy} border border-archivist-outline-variant bg-archivist-surface-lowest text-archivist-ink hover:bg-archivist-surface-high`}
                  >
                    Reopen buzz
                  </button>
                  <button
                    type="button"
                    disabled={!onHostCloseClue}
                    onClick={onHostCloseClue}
                    className={`${btnCleopardy} bg-archivist-ink text-archivist-cream hover:opacity-90`}
                  >
                    Close clue
                  </button>
                </div>
                <p className="mt-3 text-xs text-archivist-accent">
                  The server validates each action; errors appear above.
                </p>
              </div>
            ) : null}
          </>
        ) : (
          <div
            className="rounded-sm border border-red-200 bg-red-50 px-5 py-6 text-sm text-red-800"
            role="alert"
          >
            Clue data is missing.
          </div>
        )}
      </div>
    </div>
  );
}
