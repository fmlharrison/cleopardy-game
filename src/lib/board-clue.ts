import type { Board, Clue } from "@/types/game";

/** Resolve a clue from the board by id (ids are unique board-wide per MVP schema). */
export function getClueById(
  board: Board | null,
  clueId: string | null,
): Clue | null {
  if (!board || !clueId) {
    return null;
  }
  for (const category of board.categories) {
    const found = category.clues.find((c) => c.id === clueId);
    if (found) {
      return found;
    }
  }
  return null;
}
