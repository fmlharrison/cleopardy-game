import { v4 as uuidv4 } from "uuid";

import type { Board, Category, Clue } from "@/types/game";

/** Editor state: dollar values are derived from clue order when building a `Board`. */
export type DraftClue = {
  id: string;
  question: string;
  answer: string;
};

export type DraftCategory = {
  id: string;
  name: string;
  clues: DraftClue[];
};

export function newDraftClue(): DraftClue {
  return { id: uuidv4(), question: "", answer: "" };
}

export function newDraftCategory(): DraftCategory {
  return { id: uuidv4(), name: "", clues: [newDraftClue()] };
}

export function createInitialDraft(): DraftCategory[] {
  return [newDraftCategory()];
}

export function cluesToBoardClues(clues: DraftClue[]): Clue[] {
  return clues.map((c, i) => ({
    id: c.id,
    value: 200 * (i + 1),
    question: c.question,
    answer: c.answer,
  }));
}

export function draftCategoriesToBoardCategories(
  categories: DraftCategory[],
): Category[] {
  return categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    clues: cluesToBoardClues(cat.clues),
  }));
}

/** Build a `Board` for validation / session create. Empty title becomes “Custom game”. */
export function draftToBoard(
  boardTitleInput: string,
  categories: DraftCategory[],
): Board {
  const title = boardTitleInput.trim() || "Custom game";
  return {
    title,
    categories: draftCategoriesToBoardCategories(categories),
  };
}
