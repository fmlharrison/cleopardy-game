import { z } from "zod";

import type { Board } from "@/types/game";

const clueSchema = z.object({
  id: z.string().min(1, "Clue id must be non-empty"),
  value: z.number().int().positive(),
  question: z.string(),
  answer: z.string(),
});

const categorySchema = z.object({
  id: z.string().min(1, "Category id must be non-empty"),
  name: z.string(),
  clues: z.array(clueSchema).min(1).max(5),
});

export const boardSchema = z
  .object({
    title: z.string().min(1, "Title is required"),
    categories: z.array(categorySchema).min(1).max(6),
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
    for (const cat of data.categories) {
      for (const clue of cat.clues) {
        clueIds.push(clue.id);
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
