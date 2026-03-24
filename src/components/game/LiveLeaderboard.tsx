import { rankPlayers } from "@/lib/ranking";
import { ui } from "@/lib/ui";
import type { Player } from "@/types/game";

export type LiveLeaderboardProps = {
  players: Player[];
  /** Highlight the signed-in player row (omit for host-only views). */
  selfPlayerId?: string | null;
  showConnection?: boolean;
};

function rankBadgeClass(rank: number): string {
  if (rank === 1) {
    return "bg-amber-400 text-amber-950 ring-2 ring-amber-200 dark:bg-amber-500 dark:text-amber-950 dark:ring-amber-700/60";
  }
  if (rank === 2) {
    return "bg-slate-200 text-slate-800 ring-1 ring-slate-300 dark:bg-slate-600 dark:text-slate-100 dark:ring-slate-500";
  }
  if (rank === 3) {
    return "bg-amber-900/20 text-amber-950 ring-1 ring-amber-800/40 dark:bg-amber-950/50 dark:text-amber-100 dark:ring-amber-700/50";
  }
  return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200";
}

/**
 * Standings during play: explicit rank, score, optional connection — same order as end-game {@link rankPlayers}.
 */
export function LiveLeaderboard({
  players,
  selfPlayerId = null,
  showConnection = true,
}: LiveLeaderboardProps) {
  const ranked = rankPlayers(players);
  const awayCount = showConnection
    ? players.filter((p) => !p.connected).length
    : 0;

  return (
    <section
      aria-labelledby="live-leaderboard-heading"
      className={`${ui.surfacePanel} space-y-3`}
    >
      <div className="flex items-center justify-between gap-2 border-b border-zinc-200 pb-2 dark:border-zinc-700">
        <h2 id="live-leaderboard-heading" className={ui.sectionTitle}>
          Leaderboard
        </h2>
        {showConnection ? (
          <span className="rounded-full border border-zinc-300 bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
            {awayCount === 0 ? "All here" : `${awayCount} away`}
          </span>
        ) : null}
      </div>
      <p className={ui.helper}>
        Ranked by score, then who joined first when tied.
      </p>
      {ranked.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">No players.</p>
      ) : (
        <ol className="space-y-2">
          {ranked.map((r) => {
            const isSelf = selfPlayerId !== null && r.playerId === selfPlayerId;
            return (
              <li
                key={r.playerId}
                className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 sm:px-4 ${
                  isSelf
                    ? "border-blue-400/70 bg-blue-50/90 dark:border-blue-600/60 dark:bg-blue-950/35"
                    : "border-zinc-200 bg-zinc-50/80 dark:border-zinc-700 dark:bg-zinc-900/40"
                }`}
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-black tabular-nums ${rankBadgeClass(r.rank)}`}
                    aria-label={`Rank ${r.rank}`}
                  >
                    {r.rank}
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate font-semibold text-zinc-900 dark:text-zinc-100">
                        {r.name}
                      </span>
                      {isSelf ? (
                        <span className="shrink-0 rounded bg-blue-600 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white dark:bg-blue-500">
                          You
                        </span>
                      ) : null}
                    </div>
                    {showConnection ? (
                      <span
                        className={
                          players.find((p) => p.id === r.playerId)?.connected
                            ? "text-[11px] font-medium text-emerald-700 dark:text-emerald-400"
                            : "text-[11px] font-medium text-zinc-500 dark:text-zinc-400"
                        }
                      >
                        {players.find((p) => p.id === r.playerId)?.connected
                          ? "Here"
                          : "Away"}
                      </span>
                    ) : null}
                  </div>
                </div>
                <span className="shrink-0 rounded-lg bg-white px-2.5 py-1 text-lg font-black tabular-nums text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-100">
                  ${r.score}
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
