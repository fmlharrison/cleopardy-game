import type { Board } from "@/types/game";

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
      ? "Board selection"
      : phase === "clue_open"
        ? "Clue open"
        : "Judging";

  return (
    <section
      aria-labelledby="board-grid-heading"
      className="space-y-3 rounded-lg border border-zinc-200 bg-zinc-50/80 p-3 dark:border-zinc-700 dark:bg-zinc-900/40"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1">
          <h2
            id="board-grid-heading"
            className="text-sm font-semibold text-zinc-800 dark:text-zinc-200"
          >
            Board
          </h2>
          <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            {board.title}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{caption}</p>
        </div>
        <p className="self-start rounded-full border border-blue-300 bg-blue-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-blue-800 dark:border-blue-700 dark:bg-blue-950/40 dark:text-blue-200">
          {phaseLabel}
        </p>
      </div>

      <div className="flex items-center gap-3 text-xs text-zinc-600 dark:text-zinc-400">
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-blue-500" />
          Active clue
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-zinc-400" />
          Answered
        </span>
      </div>

      <div
        className="grid gap-2 overflow-x-auto pb-2"
        style={{
          gridTemplateColumns: `repeat(${board.categories.length}, minmax(5.5rem, 1fr))`,
        }}
      >
        {board.categories.map((cat) => {
          const clues = [...cat.clues].sort((a, b) => a.value - b.value);
          return (
            <div key={cat.id} className="flex min-w-0 flex-col gap-1">
              <div className="flex min-h-[3.5rem] items-center justify-center rounded-md border border-zinc-700 bg-zinc-900 px-2 py-2 text-center text-[11px] font-bold uppercase tracking-wide leading-tight text-zinc-50 shadow-sm dark:border-zinc-300 dark:bg-zinc-100 dark:text-zinc-900">
                {cat.name}
              </div>
              {clues.map((clue) => {
                const isAnswered = answered.has(clue.id);
                const isCurrent = currentClueId === clue.id;
                const canClick =
                  hostCanSelectClues &&
                  !isAnswered &&
                  Boolean(onHostSelectClue);

                const cellClass = `flex min-h-[3rem] w-full items-center justify-center rounded-md border text-sm font-semibold tabular-nums transition ${
                  isAnswered
                    ? "cursor-not-allowed border-zinc-300 bg-zinc-200 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
                    : isCurrent
                      ? "border-blue-500 bg-blue-100 text-blue-950 ring-2 ring-blue-500 dark:border-blue-400 dark:bg-blue-950/60 dark:text-blue-50 dark:ring-blue-400"
                      : "border-amber-400/80 bg-amber-50 text-amber-950 dark:border-amber-600/60 dark:bg-amber-950/40 dark:text-amber-100"
                } ${canClick ? "cursor-pointer hover:brightness-95 active:scale-[0.98]" : ""}`;

                if (canClick) {
                  return (
                    <button
                      key={clue.id}
                      type="button"
                      className={cellClass}
                      onClick={() => onHostSelectClue?.(clue.id)}
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
                  >
                    {isAnswered ? "Answered" : `$${clue.value}`}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </section>
  );
}
