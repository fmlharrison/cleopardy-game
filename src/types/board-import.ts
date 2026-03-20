import type { z } from "zod";

/** Result of the last explicit validation attempt (separate from `validatedBoard`). */
export type BoardImportValidation =
  | { kind: "idle" }
  | { kind: "empty" }
  | { kind: "syntax"; message: string }
  | { kind: "schema"; error: z.ZodError }
  | { kind: "ok" };
