import type { RankedPlayer } from "@/types/game";

export type EndGameLeaderboardProps = {
  rankings: RankedPlayer[];
};

export function EndGameLeaderboard({ rankings }: EndGameLeaderboardProps) {
  const winner = rankings[0] ?? null;
  const rest = rankings.slice(1);

  return (
    <section
      aria-labelledby="endgame-heading"
      className="font-archivist mx-auto w-full max-w-2xl rounded-sm border border-archivist-outline-variant/20 bg-archivist-surface-lowest p-5 shadow-sm md:p-8"
    >
      <header className="mb-8 border-b border-archivist-outline-variant/20 pb-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-archivist-accent">
          Game over
        </p>
        <h2
          id="endgame-heading"
          className="mt-2 text-3xl font-black tracking-tighter text-archivist-ink md:text-4xl"
        >
          Final results
        </h2>
        <p className="mt-2 max-w-prose text-sm leading-relaxed text-archivist-accent">
          Thanks for playing. Scores are final for this session.
        </p>
      </header>

      {winner ? (
        <div className="endgame-reveal relative mb-10">
          <div
            className="absolute inset-0 -rotate-1 translate-x-2 translate-y-2 rounded-sm bg-archivist-tertiary opacity-5"
            aria-hidden
          />
          <div
            className="relative rounded-sm border border-archivist-outline-variant/10 bg-archivist-surface-lowest p-6 shadow-sm md:p-8"
            role="status"
          >
            <div className="border-l-4 border-archivist-ink pl-5 md:pl-6">
              <div className="flex flex-wrap items-center gap-4">
                <span
                  className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-archivist-primary-container text-2xl font-black text-archivist-cream shadow-sm"
                  aria-hidden
                >
                  1
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-archivist-accent">
                    Winner
                  </p>
                  <p className="mt-1 text-2xl font-bold leading-tight text-archivist-ink md:text-3xl">
                    {winner.name}
                  </p>
                </div>
              </div>
              <p className="mt-6 text-4xl font-black tabular-nums tracking-tight text-archivist-ink sm:text-5xl">
                ${winner.score}
              </p>
              <p className="mt-3 text-sm font-medium text-archivist-on-surface-variant">
                Highest score when the game ended.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-center text-sm text-archivist-on-surface-variant sm:text-left">
          No players in this session.
        </p>
      )}

      {rest.length > 0 ? (
        <div className="space-y-4 border-t border-archivist-outline-variant/20 pt-8">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-archivist-accent">
            Rest of the field
            <span className="ml-2 font-normal text-archivist-on-surface-variant">
              ({rest.length})
            </span>
          </h3>
          <ol className="space-y-3">
            {rest.map((r) => (
              <li
                key={r.playerId}
                className="flex items-center justify-between gap-4 rounded-sm border-l-4 border-transparent bg-archivist-surface-low p-4 opacity-95 shadow-sm"
              >
                <div className="flex min-w-0 flex-1 items-center gap-4">
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-archivist-surface-high text-sm font-black tabular-nums text-archivist-ink"
                    aria-label={`Rank ${r.rank}`}
                  >
                    {r.rank}
                  </span>
                  <span className="truncate text-xs font-bold uppercase tracking-widest text-archivist-tertiary">
                    {r.name}
                  </span>
                </div>
                <span className="shrink-0 text-xl font-black tabular-nums tracking-tight text-archivist-ink md:text-2xl">
                  ${r.score}
                </span>
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </section>
  );
}
