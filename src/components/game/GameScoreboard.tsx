import type { Player } from "@/types/game";

export type GameScoreboardProps = {
  players: Player[];
  showConnection?: boolean;
  /** Highlights this player’s row (e.g. buzz winner). */
  emphasizePlayerId?: string | null;
};

export function GameScoreboard({
  players,
  showConnection = false,
  emphasizePlayerId = null,
}: GameScoreboardProps) {
  const sorted = [...players].sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.joinOrder - b.joinOrder;
  });

  return (
    <section aria-labelledby="scoreboard-heading" className="space-y-2">
      <h2
        id="scoreboard-heading"
        className="text-sm font-semibold text-zinc-800 dark:text-zinc-200"
      >
        Scores
      </h2>
      {sorted.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">No players.</p>
      ) : (
        <ul className="divide-y divide-zinc-200 rounded-md border border-zinc-200 dark:divide-zinc-700 dark:border-zinc-700">
          {sorted.map((p) => (
            <li
              key={p.id}
              className={`flex items-center justify-between gap-2 px-3 py-2 text-sm ${
                emphasizePlayerId !== null && p.id === emphasizePlayerId
                  ? "bg-amber-100 ring-2 ring-inset ring-amber-500 dark:bg-amber-950/50 dark:ring-amber-400"
                  : ""
              }`}
            >
              <div className="min-w-0 flex flex-col">
                <span className="truncate font-medium text-zinc-900 dark:text-zinc-100">
                  {p.name}
                </span>
                {showConnection ? (
                  <span
                    className={
                      p.connected
                        ? "text-xs text-emerald-700 dark:text-emerald-400"
                        : "text-xs text-zinc-500 dark:text-zinc-400"
                    }
                  >
                    {p.connected ? "Connected" : "Away"}
                  </span>
                ) : null}
              </div>
              <span className="shrink-0 tabular-nums font-mono font-semibold text-zinc-800 dark:text-zinc-200">
                {p.score}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
