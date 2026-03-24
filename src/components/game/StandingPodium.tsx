import { rankPlayers } from "@/lib/ranking";
import type { Player } from "@/types/game";

export type StandingPodiumProps = {
  players: Player[];
};

export function StandingPodium({ players }: StandingPodiumProps) {
  const ranked = rankPlayers(players);

  return (
    <div className="mt-auto space-y-4 pb-8">
      <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-archivist-accent">
        Standing podium
      </h4>
      <div className="space-y-3">
        {ranked.length === 0 ? (
          <p className="text-xs text-archivist-on-surface-variant">
            No players yet.
          </p>
        ) : (
          ranked.map((r, i) => (
            <div
              key={r.playerId}
              className={`rounded-sm border-l-4 p-4 ${
                i === 0
                  ? "border-archivist-ink bg-archivist-surface-lowest"
                  : "border-transparent bg-archivist-surface-low opacity-80"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase text-archivist-ink">
                  {r.name}
                </span>
                <span className="text-sm font-black tabular-nums text-archivist-ink">
                  ${r.score}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
