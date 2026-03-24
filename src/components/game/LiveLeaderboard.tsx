import { rankPlayers } from "@/lib/ranking";
import type { Player } from "@/types/game";

export type LiveLeaderboardProps = {
  players: Player[];
  /** Highlight the signed-in player row (omit for host-only views). */
  selfPlayerId?: string | null;
  showConnection?: boolean;
};

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
      className="mx-auto w-full max-w-2xl rounded-sm border border-archivist-outline-variant/20 bg-archivist-surface-lowest p-5 shadow-sm md:p-6"
    >
      <header className="mb-6 border-b border-archivist-outline-variant/20 pb-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-archivist-accent">
          Live standings
        </p>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <h2
            id="live-leaderboard-heading"
            className="text-2xl font-black tracking-tighter text-archivist-ink md:text-3xl"
          >
            Leaderboard
          </h2>
          {showConnection ? (
            <span className="rounded-full border border-archivist-outline-variant/40 bg-archivist-surface-high px-2.5 py-1 text-[11px] font-semibold text-archivist-on-surface-variant">
              {awayCount === 0 ? "All here" : `${awayCount} away`}
            </span>
          ) : null}
        </div>
        <p className="mt-2 text-sm leading-relaxed text-archivist-accent">
          Ranked by score, then who joined first when tied.
        </p>
      </header>

      {ranked.length === 0 ? (
        <p className="text-sm text-archivist-on-surface-variant">No players.</p>
      ) : (
        <ol className="space-y-3">
          {ranked.map((r) => {
            const isSelf = selfPlayerId !== null && r.playerId === selfPlayerId;
            const connected = players.find(
              (p) => p.id === r.playerId,
            )?.connected;

            const rowStyle =
              r.rank === 1
                ? "border-archivist-ink bg-archivist-surface-lowest"
                : isSelf
                  ? "border-archivist-accent bg-archivist-surface-low"
                  : "border-transparent bg-archivist-surface-low opacity-90";

            return (
              <li
                key={r.playerId}
                className={`flex items-center justify-between gap-4 rounded-sm border-l-4 p-4 shadow-sm ${rowStyle}`}
              >
                <div className="flex min-w-0 flex-1 items-center gap-4">
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-black tabular-nums ${
                      r.rank === 1
                        ? "bg-archivist-primary-container text-archivist-cream"
                        : "bg-archivist-surface-high text-archivist-ink"
                    }`}
                    aria-label={`Rank ${r.rank}`}
                  >
                    {r.rank}
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-xs font-bold uppercase tracking-widest text-archivist-tertiary">
                        {r.name}
                      </span>
                      {isSelf ? (
                        <span className="shrink-0 rounded-full bg-archivist-surface-high px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-archivist-ink">
                          You
                        </span>
                      ) : null}
                    </div>
                    {showConnection ? (
                      <span
                        className={
                          connected
                            ? "text-[11px] font-medium text-archivist-ink/80"
                            : "text-[11px] font-medium text-archivist-accent"
                        }
                      >
                        {connected ? "Here" : "Away"}
                      </span>
                    ) : null}
                  </div>
                </div>
                <span className="shrink-0 text-xl font-black tabular-nums tracking-tight text-archivist-ink md:text-2xl">
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
