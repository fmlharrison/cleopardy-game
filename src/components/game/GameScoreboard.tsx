import { sortPlayersByStandings } from "@/lib/ranking";
import type { Player } from "@/types/game";

export type GameScoreboardProps = {
  /** Latest roster from `RoomState.players` (e.g. after each `SESSION_STATE`). */
  players: Player[];
  showConnection?: boolean;
  /** Highlights this player’s row (e.g. buzz winner). */
  emphasizePlayerId?: string | null;
};

/**
 * Live / final standings: sorted by score (desc), then join order (asc). Connection comes from `Player.connected`.
 */
export function GameScoreboard({
  players,
  showConnection = false,
  emphasizePlayerId = null,
}: GameScoreboardProps) {
  const sorted = sortPlayersByStandings(players);
  const awayCount = showConnection
    ? sorted.filter((p) => !p.connected).length
    : 0;

  return (
    <section aria-labelledby="scoreboard-heading" className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h2
          id="scoreboard-heading"
          className="text-sm font-semibold text-zinc-800 dark:text-zinc-200"
        >
          Scores
        </h2>
        {showConnection ? (
          <span className="rounded-full border border-zinc-300 bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
            {awayCount === 0 ? "All connected" : `${awayCount} away`}
          </span>
        ) : null}
      </div>
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
              <span className="shrink-0 rounded bg-zinc-100 px-2 py-0.5 tabular-nums font-mono font-semibold text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
                {`$${p.score}`}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
