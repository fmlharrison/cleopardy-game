import type { z } from "zod";

import { parseBoard } from "@/schemas/board-schema";
import type { Board } from "@/types/game";

export type ValidateBoardJsonResult =
  | { outcome: "empty" }
  | { outcome: "syntax"; message: string }
  | { outcome: "schema"; error: z.ZodError }
  | { outcome: "ok"; board: Board };

export function validateBoardJson(raw: string): ValidateBoardJsonResult {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { outcome: "empty" };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed) as unknown;
  } catch (e) {
    const message = e instanceof Error ? e.message : "Invalid JSON syntax.";
    return { outcome: "syntax", message };
  }

  const result = parseBoard(parsed);
  if (!result.ok) {
    return { outcome: "schema", error: result.error };
  }

  return { outcome: "ok", board: result.board };
}
