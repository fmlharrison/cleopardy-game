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
      className={`${ui.surfacePanel} overflow-hidden border-zinc-300/90 p-0 shadow-md dark:border-zinc-600`}
    >
      <div className="border-b border-zinc-200 bg-gradient-to-b from-zinc-100 to-zinc-50 px-4 py-4 dark:border-zinc-700 dark:from-zinc-900 dark:to-zinc-950/80 sm:px-5 sm:py-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
              Game board
            </p>
            <h2
              id="board-grid-heading"
              className="text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl dark:text-zinc-50"
            >
              {board.title}
            </h2>
            <p className="max-w-prose text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              {caption}
            </p>
          </div>
          <p className="shrink-0 self-start rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-center text-xs font-bold uppercase tracking-wide text-blue-900 dark:border-blue-800 dark:bg-blue-950/70 dark:text-blue-100">
            {phaseLabel}
          </p>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-zinc-200/80 pt-3 text-[11px] font-medium text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm bg-amber-500 shadow-sm" />
            Open
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm bg-blue-500 shadow-sm ring-2 ring-blue-300 dark:ring-blue-700" />
            Active
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm bg-zinc-400 dark:bg-zinc-600" />
            Taken
          </span>
        </div>
      </div>

      <div className="bg-slate-950 px-3 py-4 dark:bg-black/40 sm:px-4 sm:py-5">
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
                <div className="flex min-h-[4rem] items-center justify-center rounded-md border-b-4 border-amber-500 bg-gradient-to-b from-blue-800 to-blue-950 px-2 py-2 text-center shadow-inner dark:from-blue-900 dark:to-slate-950">
                  <span className="text-[11px] font-bold uppercase leading-snug tracking-wide text-white sm:text-xs">
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

                  const cellClass = `flex min-h-[3.25rem] w-full items-center justify-center rounded-md border-2 text-center font-bold tabular-nums transition-colors sm:min-h-[3.5rem] sm:text-base ${
                    isAnswered
                      ? "cursor-not-allowed border-zinc-700/80 bg-slate-800/90 text-zinc-500 line-through decoration-zinc-500 dark:border-zinc-600 dark:bg-zinc-900/80"
                      : isCurrent
                        ? "border-blue-400 bg-blue-600 text-white shadow-lg shadow-blue-900/40 ring-2 ring-blue-300 dark:border-blue-400 dark:bg-blue-700 dark:ring-blue-500/50"
                        : "border-amber-600/90 bg-amber-400 text-amber-950 shadow-md hover:brightness-105 dark:border-amber-600 dark:bg-amber-500 dark:text-amber-950"
                  } ${canClick ? "cursor-pointer active:brightness-95" : ""}`;

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
