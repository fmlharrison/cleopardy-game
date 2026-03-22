import type { RankedPlayer } from "@/types/game";

export type EndGameLeaderboardProps = {
  rankings: RankedPlayer[];
};

export function EndGameLeaderboard({ rankings }: EndGameLeaderboardProps) {
  const winner = rankings[0] ?? null;

  return (
    <section aria-labelledby="endgame-heading" className="space-y-6">
      <h2
        id="endgame-heading"
        className="text-sm font-semibold text-zinc-800 dark:text-zinc-200"
      >
        Final results
      </h2>

      {winner ? (
        <div className="rounded-lg border border-amber-400/80 bg-amber-50 px-4 py-3 dark:border-amber-600/50 dark:bg-amber-950/40">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-900 dark:text-amber-200">
            Winner
          </p>
          <p className="mt-1 text-xl font-bold text-amber-950 dark:text-amber-50">
            {winner.name}
          </p>
          <p className="text-sm tabular-nums text-amber-900/90 dark:text-amber-100">
            {winner.score} points
          </p>
        </div>
      ) : (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          No players in this session.
        </p>
      )}

      {rankings.length > 0 ? (
        <div className="space-y-2">
          <h3 className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Leaderboard
          </h3>
          <ol className="divide-y divide-zinc-200 rounded-md border border-zinc-200 dark:divide-zinc-700 dark:border-zinc-700">
            {rankings.map((r) => (
              <li
                key={r.playerId}
                className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
              >
                <div className="flex min-w-0 items-baseline gap-2">
                  <span className="w-6 shrink-0 font-mono text-zinc-500 dark:text-zinc-400">
                    {r.rank}.
                  </span>
                  <span className="truncate font-medium text-zinc-900 dark:text-zinc-100">
                    {r.name}
                  </span>
                </div>
                <span className="shrink-0 tabular-nums font-mono font-semibold text-zinc-800 dark:text-zinc-200">
                  {r.score}
                </span>
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </section>
  );
}
