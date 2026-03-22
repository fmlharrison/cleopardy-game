import type { Board } from "@/types/game";

export type GameBoardGridProps = {
  board: Board;
  answeredClueIds: string[];
};

export function GameBoardGrid({ board, answeredClueIds }: GameBoardGridProps) {
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
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Clues are read-only until the host opens one (coming next).
        </p>
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
                return (
                  <div
                    key={clue.id}
                    className={`flex min-h-[2.75rem] items-center justify-center rounded-md border text-sm font-semibold tabular-nums ${
                      isAnswered
                        ? "border-zinc-200 bg-zinc-100 text-zinc-400 line-through dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-600"
                        : "border-amber-400/80 bg-amber-50 text-amber-950 dark:border-amber-600/60 dark:bg-amber-950/40 dark:text-amber-100"
                    }`}
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
