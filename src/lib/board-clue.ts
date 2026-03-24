import type { Board, Clue } from "../types/game";

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

/** Category title for a clue id, if present on the board. */
export function getCategoryNameForClueId(
  board: Board | null,
  clueId: string | null,
): string | null {
  if (!board || !clueId) {
    return null;
  }
  for (const category of board.categories) {
    if (category.clues.some((c) => c.id === clueId)) {
      return category.name;
    }
  }
  return null;
}

/** All clue ids on the board (order: categories left-to-right, clues ascending by array order). */
export function getBoardClueIds(board: Board): string[] {
  const ids: string[] = [];
  for (const category of board.categories) {
    for (const clue of category.clues) {
      ids.push(clue.id);
    }
  }
  return ids;
}
