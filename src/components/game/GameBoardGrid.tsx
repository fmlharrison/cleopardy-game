import type { Board } from "@/types/game";

export type GameBoardGridProps = {
  board: Board;
  answeredClueIds: string[];
  /** Highlight the active clue (open or judging). */
  currentClueId: string | null;
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
  hostCanSelectClues,
  onHostSelectClue,
  caption,
}: GameBoardGridProps) {
  const answered = new Set(answeredClueIds);

  return (
    <section aria-labelledby="board-grid-heading" className="space-y-3">
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
              <div className="flex min-h-[3rem] items-center justify-center rounded-md bg-zinc-900 px-1 py-2 text-center text-xs font-semibold uppercase leading-tight text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900">
                {cat.name}
              </div>
              {clues.map((clue) => {
                const isAnswered = answered.has(clue.id);
                const isCurrent = currentClueId === clue.id;
                const canClick =
                  hostCanSelectClues &&
                  !isAnswered &&
                  Boolean(onHostSelectClue);

                const cellClass = `flex min-h-[2.75rem] w-full items-center justify-center rounded-md border text-sm font-semibold tabular-nums transition ${
                  isAnswered
                    ? "cursor-not-allowed border-zinc-200 bg-zinc-100 text-zinc-400 line-through dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-600"
                    : isCurrent
                      ? "border-blue-500 bg-blue-50 text-blue-950 ring-2 ring-blue-500 dark:border-blue-400 dark:bg-blue-950/50 dark:text-blue-50 dark:ring-blue-400"
                      : "border-amber-400/80 bg-amber-50 text-amber-950 dark:border-amber-600/60 dark:bg-amber-950/40 dark:text-amber-100"
                } ${canClick ? "cursor-pointer hover:opacity-90 active:scale-[0.98]" : ""}`;

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
                    ${clue.value}
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
