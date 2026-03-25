import { z } from "zod";

import type { Board } from "@/types/game";

const nonEmptyTrimmed = (field: string) =>
  z.string().trim().min(1, `${field} is required`);

const clueSchema = z.object({
  id: z.string().min(1, "Clue id must be non-empty"),
  value: z.number().int().positive(),
  question: nonEmptyTrimmed("Clue text"),
  answer: nonEmptyTrimmed("Correct answer"),
});

const categorySchema = z.object({
  id: z.string().min(1, "Category id must be non-empty"),
  name: nonEmptyTrimmed("Category name"),
  clues: z.array(clueSchema).min(1).max(5),
});

export const boardSchema = z
  .object({
    title: nonEmptyTrimmed("Board title"),
    categories: z.array(categorySchema).min(1).max(5),
  })
  .superRefine((data, ctx) => {
    const categoryIds = data.categories.map((c) => c.id);
    if (new Set(categoryIds).size !== categoryIds.length) {
      ctx.addIssue({
        code: "custom",
        message: "Category ids must be unique",
        path: ["categories"],
      });
    }

    const clueIds: string[] = [];
    for (let ci = 0; ci < data.categories.length; ci++) {
      const cat = data.categories[ci];
      for (let li = 0; li < cat.clues.length; li++) {
        const clue = cat.clues[li];
        clueIds.push(clue.id);
        const expected = 200 * (li + 1);
        if (clue.value !== expected) {
          ctx.addIssue({
            code: "custom",
            message: `Clue value must be $${expected} (clue ${li + 1} in category ${ci + 1})`,
            path: ["categories", ci, "clues", li, "value"],
          });
        }
      }
    }
    if (new Set(clueIds).size !== clueIds.length) {
      ctx.addIssue({
        code: "custom",
        message: "Clue ids must be unique across the board",
        path: ["categories"],
      });
    }
  });

export type ParsedBoard = z.infer<typeof boardSchema>;

export function parseBoard(
  data: unknown,
): { ok: true; board: Board } | { ok: false; error: z.ZodError } {
  const result = boardSchema.safeParse(data);
  if (!result.success) {
    return { ok: false, error: result.error };
  }
  return { ok: true, board: result.data as Board };
}
