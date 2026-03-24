import { ui } from "@/lib/ui";
import type { RankedPlayer } from "@/types/game";

export type EndGameLeaderboardProps = {
  rankings: RankedPlayer[];
};

function rankBadgeClass(rank: number): string {
  if (rank === 2) {
    return "bg-slate-200 text-slate-800 ring-1 ring-slate-300 dark:bg-slate-700 dark:text-slate-100 dark:ring-slate-600";
  }
  if (rank === 3) {
    return "bg-amber-900/25 text-amber-950 ring-1 ring-amber-700/40 dark:bg-amber-950/50 dark:text-amber-100 dark:ring-amber-600/50";
  }
  return "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200";
}

export function EndGameLeaderboard({ rankings }: EndGameLeaderboardProps) {
  const winner = rankings[0] ?? null;
  const rest = rankings.slice(1);

  return (
    <section
      aria-labelledby="endgame-heading"
      className="mx-auto w-full max-w-3xl space-y-0 overflow-hidden rounded-2xl border-2 border-zinc-300 shadow-xl dark:border-zinc-600"
    >
      <header className="jeopardy-clue-hero px-6 py-6 text-white sm:px-8 sm:py-8">
        <p
          className="text-[11px] font-bold uppercase tracking-[0.25em]"
          style={{ color: "var(--jeopardy-clue-accent)" }}
        >
          Game over
        </p>
        <h2
          id="endgame-heading"
          className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl"
        >
          Final results
        </h2>
        <p className="mt-2 max-w-prose text-sm leading-relaxed text-zinc-300">
          Thanks for playing. Scores are final for this session.
        </p>
      </header>

      <div className="space-y-8 bg-white px-6 py-8 dark:bg-zinc-950/50 sm:px-8">
        {winner ? (
          <div
            className="endgame-reveal relative overflow-hidden rounded-2xl border-2 border-amber-400/90 bg-gradient-to-b from-amber-50 via-amber-100/80 to-amber-200/50 p-6 shadow-lg ring-2 ring-amber-300/40 dark:border-amber-500/60 dark:from-amber-950/80 dark:via-amber-950/50 dark:to-slate-950 dark:ring-amber-700/30 sm:p-8"
            role="status"
          >
            <div
              className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-amber-400/20 blur-2xl dark:bg-amber-400/10"
              aria-hidden
            />
            <div className="relative space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-2xl font-black text-amber-950 shadow-lg ring-2 ring-amber-200/80 dark:from-amber-500 dark:to-amber-700 dark:text-amber-950 dark:ring-amber-800/50">
                  1
                </span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-900/80 dark:text-amber-200/90">
                    Winner
                  </p>
                  <p className="mt-0.5 text-2xl font-bold leading-tight text-amber-950 sm:text-3xl dark:text-amber-50">
                    {winner.name}
                  </p>
                </div>
              </div>
              <p className="text-4xl font-black tabular-nums tracking-tight text-amber-950 dark:text-amber-100 sm:text-5xl">
                ${winner.score}
              </p>
              <p className="text-sm font-medium text-amber-900/80 dark:text-amber-200/80">
                Highest score when the game ended.
              </p>
            </div>
          </div>
        ) : (
          <p className="text-center text-sm text-zinc-600 dark:text-zinc-400 sm:text-left">
            No players in this session.
          </p>
        )}

        {rest.length > 0 ? (
          <div className="space-y-4 border-t border-zinc-200 pt-8 dark:border-zinc-700">
            <h3 className={ui.sectionTitle}>
              Rest of the field
              <span className="ml-2 font-normal text-zinc-500 dark:text-zinc-400">
                ({rest.length})
              </span>
            </h3>
            <ol className="space-y-2">
              {rest.map((r) => (
                <li
                  key={r.playerId}
                  className="flex items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-zinc-50/90 px-4 py-3 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/40 sm:px-5"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold tabular-nums ${rankBadgeClass(r.rank)}`}
                      aria-label={`Rank ${r.rank}`}
                    >
                      {r.rank}
                    </span>
                    <span className="truncate text-base font-semibold text-zinc-900 dark:text-zinc-100">
                      {r.name}
                    </span>
                  </div>
                  <span className="shrink-0 rounded-lg bg-white px-3 py-1.5 text-lg font-bold tabular-nums text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-100">
                    ${r.score}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        ) : null}
      </div>
    </section>
  );
}
