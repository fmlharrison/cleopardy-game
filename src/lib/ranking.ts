import type { Player, RankedPlayer } from "@/types/game";

/**
 * Standings order for live UI and end-game: score descending, then join order ascending
 * (lower `joinOrder` wins ties — earlier join ranks higher at equal score).
 */
export function sortPlayersByStandings(players: Player[]): Player[] {
  return [...players].sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.joinOrder - b.joinOrder;
  });
}

/**
 * Same ordering as {@link sortPlayersByStandings}, with explicit ranks (e.g. `GAME_ENDED` payloads).
 */
export function rankPlayers(players: Player[]): RankedPlayer[] {
  const sorted = sortPlayersByStandings(players);

  return sorted.map((p, index) => ({
    rank: index + 1,
    playerId: p.id,
    name: p.name,
    score: p.score,
    joinOrder: p.joinOrder,
  }));
}
