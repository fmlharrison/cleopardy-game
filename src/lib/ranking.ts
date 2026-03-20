import type { Player, RankedPlayer } from "@/types/game";

/**
 * Final ordering: score descending, then join order ascending (lower joinOrder wins ties).
 */
export function rankPlayers(players: Player[]): RankedPlayer[] {
  const sorted = [...players].sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.joinOrder - b.joinOrder;
  });

  return sorted.map((p, index) => ({
    rank: index + 1,
    playerId: p.id,
    name: p.name,
    score: p.score,
    joinOrder: p.joinOrder,
  }));
}
