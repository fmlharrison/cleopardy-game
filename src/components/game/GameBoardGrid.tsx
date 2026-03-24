import type { Board } from "@/types/game";

import { ui } from "@/lib/ui";

export type GameBoardGridProps = {
  board: Board;
  answeredClueIds: string[];
  /** Highlight the active clue (open or judging). */
  currentClueId: string | null;
  /** Current gameplay phase while board is visible. */
  phase: "board" | "clue_open" | "judging";
  /** Host may choose a clue only in the `board` phase with a valid stored host id. */
  hostCanSelectClues: boolean;
  onHostSelectClue?: (clueId: string) => void;
  /** Short line under the board title (host vs player copy). */
  caption: string;
};

export function GameBoardGrid({
  board,
  answeredClueIds,
  currentClueId,
  phase,
  hostCanSelectClues,
  onHostSelectClue,
  caption,
}: GameBoardGridProps) {
  const answered = new Set(answeredClueIds);
  const phaseLabel =
    phase === "board"
      ? "Pick a clue"
      : phase === "clue_open"
        ? "Clue in play"
        : "Judging";

  const colCount = board.categories.length;
  const minCol =
    colCount <= 4 ? "6.25rem" : colCount <= 5 ? "5.75rem" : "5.25rem";

  return (
    <section
      aria-labelledby="board-grid-heading"
      className={`${ui.surfacePanel} overflow-hidden border-zinc-300/90 p-0 shadow-lg ring-1 ring-black/5 dark:border-zinc-600 dark:ring-white/10`}
    >
      <div className="jeopardy-board-header border-b px-4 py-4 sm:px-5 sm:py-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
              Game board
            </p>
            <h2
              id="board-grid-heading"
              className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl dark:text-slate-50"
            >
              {board.title}
            </h2>
            <p className="max-w-prose text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              {caption}
            </p>
          </div>
          <p className="shrink-0 self-start rounded-md border border-blue-300/80 bg-blue-600/10 px-3 py-1.5 text-center text-xs font-bold uppercase tracking-wide text-blue-900 dark:border-blue-500/50 dark:bg-blue-950/50 dark:text-blue-100">
            {phaseLabel}
          </p>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-200/90 pt-3 text-[11px] font-semibold text-slate-600 dark:border-slate-600/80 dark:text-slate-400">
          <span className="inline-flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-sm shadow-sm"
              style={{ background: "var(--jeopardy-legend-open)" }}
            />
            Open
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-sm shadow-sm ring-2"
              style={{
                background: "var(--jeopardy-legend-active)",
                boxShadow: "0 0 0 2px var(--jeopardy-cell-active-ring)",
              }}
            />
            Active
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-sm"
              style={{ background: "var(--jeopardy-legend-taken)" }}
            />
            Taken
          </span>
        </div>
      </div>

      <div className="jeopardy-board-stage px-3 py-5 sm:px-4 sm:py-6">
        <div
          className="mx-auto grid w-max max-w-full gap-2 sm:gap-3"
          style={{
            gridTemplateColumns: `repeat(${colCount}, minmax(${minCol}, 1fr))`,
          }}
        >
          {board.categories.map((cat) => {
            const clues = [...cat.clues].sort((a, b) => a.value - b.value);
            return (
              <div
                key={cat.id}
                className="flex min-w-0 flex-col gap-1.5 sm:gap-2"
              >
                <div className="jeopardy-category-tile">
                  <span className="text-[11px] font-bold uppercase leading-snug tracking-wide text-white drop-shadow-sm sm:text-xs">
                    {cat.name}
                  </span>
                </div>
                {clues.map((clue) => {
                  const isAnswered = answered.has(clue.id);
                  const isCurrent = currentClueId === clue.id;
                  const canClick =
                    hostCanSelectClues &&
                    !isAnswered &&
                    Boolean(onHostSelectClue);

                  const stateClass = isAnswered
                    ? "jeopardy-value-cell--taken"
                    : isCurrent
                      ? "jeopardy-value-cell--active"
                      : "jeopardy-value-cell--open";

                  const cellClass = `flex min-h-[3.25rem] w-full items-center justify-center rounded-md border-2 text-center text-sm font-black tabular-nums tracking-tight transition-[filter,transform] sm:min-h-[3.5rem] sm:text-base ${stateClass} ${
                    canClick
                      ? "cursor-pointer hover:brightness-105 active:scale-[0.98] active:brightness-95"
                      : isAnswered
                        ? "cursor-not-allowed opacity-90"
                        : ""
                  }`;

                  const label = isAnswered
                    ? `Taken, was $${clue.value}`
                    : `$${clue.value}`;

                  if (canClick) {
                    return (
                      <button
                        key={clue.id}
                        type="button"
                        className={cellClass}
                        onClick={() => onHostSelectClue?.(clue.id)}
                        aria-label={`Open clue for $${clue.value}`}
                      >
                        ${clue.value}
                      </button>
                    );
                  }

                  return (
                    <div
                      key={clue.id}
                      className={cellClass}
                      aria-current={isCurrent ? "true" : undefined}
                      aria-label={label}
                    >
                      ${clue.value}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
