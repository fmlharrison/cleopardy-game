import { MdClose } from "@/components/icons/md";
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
      ? "Pick a clue"
      : phase === "clue_open"
        ? "Clue in play"
        : "Judging";

  const colCount = board.categories.length;

  return (
    <section
      aria-labelledby="board-grid-heading"
      className="w-full max-w-[100rem]"
    >
      <header className="mb-10 max-w-4xl md:mb-16">
        <div className="mb-4 inline-block bg-archivist-primary-container px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-archivist-cream">
          {phaseLabel}
        </div>
        <h2
          id="board-grid-heading"
          className="mb-4 text-4xl font-black tracking-tighter text-archivist-ink md:text-5xl"
        >
          {board.title}
        </h2>
        <p className="max-w-xl text-base font-medium leading-relaxed text-archivist-accent">
          {caption}
        </p>
      </header>

      <div
        className="grid w-full gap-4 sm:gap-6"
        style={{
          gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))`,
        }}
      >
        {board.categories.map((cat) => {
          const clues = [...cat.clues].sort((a, b) => a.value - b.value);
          return (
            <div key={cat.id} className="flex min-w-0 flex-col gap-4 sm:gap-6">
              <div className="flex h-24 items-center justify-center rounded-sm bg-archivist-surface-high p-3 text-center sm:p-4">
                <h3 className="text-[10px] font-black uppercase leading-tight tracking-widest text-archivist-ink">
                  {cat.name}
                </h3>
              </div>
              {clues.map((clue) => {
                const isAnswered = answered.has(clue.id);
                const isCurrent = currentClueId === clue.id;
                const canClick =
                  hostCanSelectClues &&
                  !isAnswered &&
                  Boolean(onHostSelectClue);

                const baseCell =
                  "group flex h-36 w-full items-center justify-center rounded-sm text-center transition-all duration-300 sm:h-40";

                const openStyle = canClick
                  ? "cursor-pointer bg-archivist-ink text-archivist-cream hover:bg-archivist-accent"
                  : "bg-archivist-ink text-archivist-cream";

                const activeRing = isCurrent
                  ? "border-4 border-archivist-accent"
                  : "";

                const takenStyle =
                  "cursor-not-allowed bg-archivist-surface-highest text-archivist-ink opacity-40";

                const cellClass = `${baseCell} ${
                  isAnswered ? takenStyle : `${openStyle} ${activeRing}`
                } ${!isAnswered && !canClick && !isCurrent ? "cursor-default" : ""}`;

                const label = isAnswered
                  ? `Taken, was $${clue.value}`
                  : `$${clue.value}`;

                const inner = isAnswered ? (
                  <MdClose
                    className="h-9 w-9 shrink-0 text-archivist-ink"
                    aria-hidden
                  />
                ) : (
                  <span className="text-xl font-black tabular-nums sm:text-2xl">
                    ${clue.value}
                  </span>
                );

                if (canClick) {
                  return (
                    <button
                      key={clue.id}
                      type="button"
                      className={cellClass}
                      onClick={() => onHostSelectClue?.(clue.id)}
                      aria-label={`Open clue for $${clue.value}`}
                    >
                      {inner}
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
                    {inner}
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
