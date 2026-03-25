"use client";

import Link from "next/link";
import { useId, useState } from "react";

import type { GamePlayTab } from "@/components/game/GamePlayShell";
import {
  MdFace,
  MdGridView,
  MdLeaderboard,
  MdOutlineGridView,
  MdOutlineLeaderboard,
  MdOutlinePayments,
  MdOutlineStars,
} from "@/components/icons/md";

export type GameShellProps = {
  tab: GamePlayTab;
  onTabChange: (tab: GamePlayTab) => void;
  /** Sidebar footer: Standing Podium vs Active Category card */
  shellMode: "board" | "clue";
  categoryName?: string | null;
  /** Subtitle under “Game status” (e.g. board title). */
  statusSubtitle?: string | null;
  phaseBadge: string;
  hostCanEndGame: boolean;
  onEndGame: () => void;
  connecting?: boolean;
  /** Standing podium or other sidebar bottom content in board mode */
  sidebarFooterBoard: React.ReactNode;
  children: React.ReactNode;
};

export function GameShell({
  tab,
  onTabChange,
  shellMode,
  categoryName,
  statusSubtitle,
  phaseBadge,
  hostCanEndGame,
  onEndGame,
  connecting,
  sidebarFooterBoard,
  children,
}: GameShellProps) {
  const [rulesOpen, setRulesOpen] = useState(false);
  const rulesTitleId = useId();

  const setBoardTab = () => onTabChange("board");
  const setLeaderTab = () => onTabChange("leaderboard");

  const sidebarFooter =
    shellMode === "clue" && categoryName ? (
      <div className="mt-auto rounded-sm border-l-4 border-archivist-tertiary bg-archivist-container p-4">
        <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-archivist-tertiary">
          Active category
        </p>
        <p className="text-sm font-bold leading-tight text-archivist-ink">
          {categoryName}
        </p>
      </div>
    ) : (
      sidebarFooterBoard
    );

  return (
    <div className="flex min-h-screen flex-col bg-archivist-cream text-archivist-ink">
      {rulesOpen ? (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-archivist-ink/40 p-4"
          role="presentation"
          onClick={() => setRulesOpen(false)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setRulesOpen(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={rulesTitleId}
            className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-sm border border-archivist-outline-variant/30 bg-archivist-surface-lowest p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <h2
              id={rulesTitleId}
              className="text-lg font-bold text-archivist-ink"
            >
              Rules
            </h2>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-archivist-on-surface-variant">
              <li>
                Responses must be in the form of a question when you play aloud.
              </li>
              <li>The host’s scoring decision is final for this session.</li>
              <li>First buzz on the server wins when buzzing is open.</li>
            </ul>
            <button
              type="button"
              className="mt-6 rounded-sm bg-archivist-primary-container px-4 py-2 text-sm font-semibold text-archivist-cream"
              onClick={() => setRulesOpen(false)}
            >
              Close
            </button>
          </div>
        </div>
      ) : null}

      <nav
        className="fixed left-0 right-0 top-0 z-50 flex items-center justify-between bg-archivist-cream px-6 py-5 md:px-12 md:py-6"
        aria-label="Game"
      >
        <div className="min-w-0 text-xl font-bold uppercase tracking-tighter text-archivist-ink md:text-2xl">
          Cleopardy
        </div>
        <div className="flex shrink-0 items-center gap-x-3 md:gap-x-6">
          <button
            type="button"
            onClick={() => setRulesOpen(true)}
            className="text-xs font-semibold text-archivist-accent underline-offset-4 hover:text-archivist-ink hover:underline sm:text-sm"
          >
            Rules
          </button>
          {connecting ? (
            <span className="text-xs text-archivist-accent">Connecting…</span>
          ) : null}
          {hostCanEndGame ? (
            <button
              type="button"
              onClick={onEndGame}
              title="Ends the session for everyone."
              className="rounded-sm border border-red-200 bg-white px-2 py-1 text-xs font-semibold text-red-800 hover:bg-red-50"
            >
              End game
            </button>
          ) : null}
          <span
            className="hidden rounded-full border border-archivist-outline-variant/40 bg-archivist-surface-lowest px-2 py-0.5 font-mono text-[10px] text-archivist-on-surface-variant sm:inline"
            title="Phase"
          >
            {phaseBadge}
          </span>
          <Link
            href="/"
            className="text-xs font-semibold text-archivist-accent underline-offset-4 hover:text-archivist-ink hover:underline"
          >
            Home
          </Link>
        </div>
      </nav>

      <div className="flex min-h-screen flex-1 pt-[5.5rem] lg:pt-24">
        <aside
          className="fixed left-0 top-[5.5rem] z-40 hidden h-[calc(100vh-5.5rem)] w-72 flex-col gap-y-6 overflow-y-auto bg-archivist-surface-low p-8 shadow-[32px_0_32px_rgba(27,28,26,0.04)] lg:top-24 lg:flex lg:h-[calc(100vh-6rem)]"
          aria-label="Game sidebar"
        >
          <div className="mb-2 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-archivist-primary-container text-archivist-cream">
              <MdFace className="h-7 w-7 text-archivist-cream" aria-hidden />
            </div>
            <div>
              <p className="text-lg font-bold text-archivist-ink">
                Game status
              </p>
              <p className="text-xs uppercase tracking-widest text-archivist-accent opacity-80">
                {statusSubtitle ?? "In play"}
              </p>
            </div>
          </div>

          <nav className="flex flex-col gap-y-2" aria-label="Sidebar views">
            <button
              type="button"
              role="tab"
              aria-selected={tab === "leaderboard"}
              onClick={setLeaderTab}
              className={`flex items-center gap-4 rounded-sm p-4 text-left text-sm font-medium transition-all ${
                tab === "leaderboard"
                  ? "scale-[0.99] bg-archivist-surface-lowest font-bold text-archivist-ink shadow-sm"
                  : "cursor-pointer text-archivist-accent opacity-70 hover:bg-white/50"
              }`}
            >
              <MdOutlinePayments className="h-5 w-5 shrink-0" aria-hidden />
              <span>Current scores</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "board"}
              onClick={setBoardTab}
              className={`flex items-center gap-4 rounded-sm p-4 text-left text-sm font-medium transition-all ${
                tab === "board"
                  ? "scale-[0.99] bg-archivist-surface-lowest font-bold text-archivist-ink shadow-sm"
                  : "cursor-pointer text-archivist-accent opacity-70 hover:bg-white/50"
              }`}
            >
              <MdOutlineStars className="h-5 w-5 shrink-0" aria-hidden />
              <span>Game board</span>
            </button>
          </nav>

          {sidebarFooter}
        </aside>

        <div
          id="play-panel"
          role="tabpanel"
          aria-label="Game content"
          className="flex min-h-0 flex-1 flex-col lg:ml-72"
        >
          <main className="flex-1 overflow-y-auto bg-archivist-surface-bright px-6 py-8 md:px-12 md:py-12">
            {children}
          </main>
        </div>
      </div>

      <nav
        className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-archivist-outline-variant/20 bg-archivist-surface-lowest py-3 lg:hidden"
        aria-label="Mobile game views"
      >
        <button
          type="button"
          id="archivist-tab-board"
          className={`flex flex-col items-center gap-1 ${tab === "board" ? "text-archivist-tertiary" : "text-archivist-accent"}`}
          onClick={setBoardTab}
        >
          {tab === "board" ? (
            <MdGridView className="h-6 w-6 shrink-0" aria-hidden />
          ) : (
            <MdOutlineGridView className="h-6 w-6 shrink-0" aria-hidden />
          )}
          <span className="text-[10px] font-bold uppercase">Board</span>
        </button>
        <button
          type="button"
          id="archivist-tab-leaderboard"
          className={`flex flex-col items-center gap-1 ${tab === "leaderboard" ? "text-archivist-tertiary" : "text-archivist-accent"}`}
          onClick={setLeaderTab}
        >
          {tab === "leaderboard" ? (
            <MdLeaderboard className="h-6 w-6 shrink-0" aria-hidden />
          ) : (
            <MdOutlineLeaderboard className="h-6 w-6 shrink-0" aria-hidden />
          )}
          <span className="text-[10px] font-bold uppercase">Scores</span>
        </button>
      </nav>

      <div className="h-16 shrink-0 lg:hidden" aria-hidden />
    </div>
  );
}
