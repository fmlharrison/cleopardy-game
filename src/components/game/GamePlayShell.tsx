"use client";

export type GamePlayTab = "board" | "leaderboard";

type GamePlayShellProps = {
  tab: GamePlayTab;
  onTabChange: (tab: GamePlayTab) => void;
  children: React.ReactNode;
};

/**
 * In-game navigation: Board vs Leaderboard. Mobile: tabs at bottom; md+: left rail.
 */
export function GamePlayShell({
  tab,
  onTabChange,
  children,
}: GamePlayShellProps) {
  return (
    <div className="flex min-h-[min(70vh,36rem)] flex-1 flex-col md:min-h-[28rem] md:flex-row">
      <div
        id="play-panel"
        role="tabpanel"
        aria-labelledby={
          tab === "board" ? "play-tab-board" : "play-tab-leaderboard"
        }
        className="order-1 min-w-0 flex-1 md:order-2 md:pl-4"
      >
        {children}
      </div>
      <nav
        className="order-2 flex shrink-0 gap-1 border-t border-zinc-200 bg-zinc-100/95 p-2 backdrop-blur-sm dark:border-zinc-700 dark:bg-zinc-900/95 md:order-1 md:w-52 md:flex-col md:border-r md:border-t-0 md:p-3"
        aria-label="Game views"
        role="tablist"
      >
        <button
          type="button"
          id="play-tab-board"
          role="tab"
          aria-selected={tab === "board"}
          aria-controls="play-panel"
          tabIndex={tab === "board" ? 0 : -1}
          onClick={() => onTabChange("board")}
          className={`rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition md:py-3 ${
            tab === "board"
              ? "bg-blue-600 text-white shadow-sm dark:bg-blue-600"
              : "text-zinc-700 hover:bg-zinc-200/80 dark:text-zinc-300 dark:hover:bg-zinc-800/80"
          }`}
        >
          Board
        </button>
        <button
          type="button"
          id="play-tab-leaderboard"
          role="tab"
          aria-selected={tab === "leaderboard"}
          aria-controls="play-panel"
          tabIndex={tab === "leaderboard" ? 0 : -1}
          onClick={() => onTabChange("leaderboard")}
          className={`rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition md:py-3 ${
            tab === "leaderboard"
              ? "bg-blue-600 text-white shadow-sm dark:bg-blue-600"
              : "text-zinc-700 hover:bg-zinc-200/80 dark:text-zinc-300 dark:hover:bg-zinc-800/80"
          }`}
        >
          Leaderboard
        </button>
      </nav>
    </div>
  );
}
