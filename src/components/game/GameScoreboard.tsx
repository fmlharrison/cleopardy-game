import { sortPlayersByStandings } from "@/lib/ranking";
import { ui } from "@/lib/ui";
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
    <section
      aria-labelledby="scoreboard-heading"
      className={`${ui.surfacePanel} space-y-3 lg:sticky lg:top-6 lg:max-h-[min(32rem,calc(100vh-5rem))] lg:overflow-y-auto`}
    >
      <div className="flex items-center justify-between gap-2 border-b border-zinc-200 pb-2 dark:border-zinc-700">
        <h2 id="scoreboard-heading" className={ui.sectionTitle}>
          Scores
        </h2>
        {showConnection ? (
          <span className="rounded-full border border-zinc-300 bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
            {awayCount === 0 ? "All here" : `${awayCount} away`}
          </span>
        ) : null}
      </div>
      {sorted.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">No players.</p>
      ) : (
        <ul className="space-y-1.5">
          {sorted.map((p) => (
            <li
              key={p.id}
              className={`flex items-center justify-between gap-2 rounded-lg border border-transparent px-2 py-2.5 text-sm ${
                emphasizePlayerId !== null && p.id === emphasizePlayerId
                  ? "border-amber-400/80 bg-amber-100 dark:border-amber-600 dark:bg-amber-950/50"
                  : "bg-zinc-50 dark:bg-zinc-900/50"
              }`}
            >
              <div className="min-w-0 flex flex-col gap-0.5">
                <span className="truncate font-semibold text-zinc-900 dark:text-zinc-100">
                  {p.name}
                </span>
                {showConnection ? (
                  <span
                    className={
                      p.connected
                        ? "text-[11px] font-medium text-emerald-700 dark:text-emerald-400"
                        : "text-[11px] font-medium text-zinc-500 dark:text-zinc-400"
                    }
                  >
                    {p.connected ? "Here" : "Away"}
                  </span>
                ) : null}
              </div>
              <span className="shrink-0 rounded-md bg-white px-2.5 py-1 tabular-nums text-base font-bold text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-100">
                {`$${p.score}`}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
