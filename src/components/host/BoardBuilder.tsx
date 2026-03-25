"use client";

import { useEffect, useMemo, useState } from "react";
import type { z } from "zod";
import { MdAdd, MdClose, MdEditNote } from "react-icons/md";

import {
  createInitialDraft,
  type DraftCategory,
  type DraftClue,
  draftToBoard,
  newDraftCategory,
  newDraftClue,
} from "@/lib/board-draft";
import { cleopardyUi } from "@/lib/ui";
import { parseBoard } from "@/schemas/board-schema";
import type { Board } from "@/types/game";

function formatZodIssues(error: z.ZodError): string[] {
  return error.issues.map((issue) => {
    const path =
      issue.path.length > 0 ? issue.path.map(String).join(".") : "(root)";
    return `${path}: ${issue.message}`;
  });
}

const colWidth = "w-[300px] shrink-0";

const inputCategory =
  "w-full border-0 border-b-2 border-archivist-outline-variant bg-transparent py-1 font-archivist text-lg font-bold text-archivist-ink outline-none placeholder:text-archivist-accent/40 focus:border-archivist-accent";

const clueCard =
  "rounded-sm border border-transparent bg-archivist-surface-low p-5 transition-all hover:border-archivist-outline-variant/30";

const clueTextarea =
  "mb-4 w-full resize-none border-0 bg-transparent p-0 text-sm leading-relaxed text-archivist-on-surface-variant outline-none ring-0 placeholder:text-archivist-accent/35 focus:ring-0";

const answerInput = `${cleopardyUi.input} border-0 bg-archivist-container text-xs`;

type BoardBuilderProps = {
  onValidBoardChange: (board: Board | null) => void;
};

export function BoardBuilder({ onValidBoardChange }: BoardBuilderProps) {
  const [boardTitle, setBoardTitle] = useState("");
  const [categories, setCategories] = useState<DraftCategory[]>(() =>
    createInitialDraft(),
  );

  const board = useMemo(
    () => draftToBoard(boardTitle, categories),
    [boardTitle, categories],
  );

  const parseResult = useMemo(() => parseBoard(board), [board]);

  useEffect(() => {
    onValidBoardChange(parseResult.ok ? parseResult.board : null);
  }, [parseResult, onValidBoardChange]);

  const issues = parseResult.ok ? [] : formatZodIssues(parseResult.error);

  const addCategory = () => {
    if (categories.length >= 5) return;
    setCategories((prev) => [...prev, newDraftCategory()]);
  };

  const removeCategory = (index: number) => {
    if (categories.length <= 1) return;
    setCategories((prev) => prev.filter((_, i) => i !== index));
  };

  const setCategoryName = (index: number, name: string) => {
    setCategories((prev) =>
      prev.map((c, i) => (i === index ? { ...c, name } : c)),
    );
  };

  const addClue = (catIndex: number) => {
    setCategories((prev) =>
      prev.map((c, i) => {
        if (i !== catIndex || c.clues.length >= 5) return c;
        return { ...c, clues: [...c.clues, newDraftClue()] };
      }),
    );
  };

  const removeClue = (catIndex: number, clueIndex: number) => {
    setCategories((prev) =>
      prev.map((c, i) => {
        if (i !== catIndex || c.clues.length <= 1) return c;
        return {
          ...c,
          clues: c.clues.filter((_, j) => j !== clueIndex),
        };
      }),
    );
  };

  const setClueField = (
    catIndex: number,
    clueIndex: number,
    field: keyof Pick<DraftClue, "question" | "answer">,
    value: string,
  ) => {
    setCategories((prev) =>
      prev.map((c, i) => {
        if (i !== catIndex) return c;
        return {
          ...c,
          clues: c.clues.map((clue, j) =>
            j === clueIndex ? { ...clue, [field]: value } : clue,
          ),
        };
      }),
    );
  };

  return (
    <div className={cleopardyUi.stackLoose}>
      <header className="shrink-0 border-l-4 border-archivist-primary-container pl-6">
        <p className={cleopardyUi.eyebrow}>Host a session</p>
        <h1 className="text-3xl font-bold tracking-tight text-archivist-ink md:text-4xl lg:text-5xl">
          Board configuration
        </h1>
        <p
          className={`${cleopardyUi.lead} mt-2 max-w-2xl text-base md:text-lg`}
        >
          Define categories and clues for your game. Add up to five categories;
          each category can have one to five clues ($200 through $1000).
        </p>
      </header>

      <div className="space-y-2">
        <label
          htmlFor="board-title"
          className={`${cleopardyUi.formLabel} block`}
        >
          Board title <span className="font-normal opacity-70">(optional)</span>
        </label>
        <input
          id="board-title"
          type="text"
          value={boardTitle}
          onChange={(e) => setBoardTitle(e.target.value)}
          placeholder="Defaults to “Custom game” if empty"
          className={cleopardyUi.input}
          autoComplete="off"
        />
      </div>

      <section
        className="board-builder-scrollbar overflow-x-auto pb-2"
        aria-label="Board categories"
      >
        <div className="flex min-w-min flex-nowrap gap-6">
          {categories.map((cat, catIndex) => (
            <div key={cat.id} className={`${colWidth} flex flex-col space-y-6`}>
              <div className="rounded-sm border border-archivist-outline-variant/20 bg-archivist-surface-high p-4 shadow-sm">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-archivist-on-surface-variant">
                    Category {String(catIndex + 1).padStart(2, "0")}
                  </label>
                  {categories.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => removeCategory(catIndex)}
                      className="shrink-0 rounded-sm p-1 text-archivist-accent transition hover:bg-archivist-container hover:text-archivist-ink"
                      aria-label={`Remove category ${catIndex + 1}`}
                    >
                      <MdClose className="h-4 w-4" aria-hidden />
                    </button>
                  ) : null}
                </div>
                <input
                  className={inputCategory}
                  placeholder="Category name"
                  type="text"
                  value={cat.name}
                  onChange={(e) => setCategoryName(catIndex, e.target.value)}
                  autoComplete="off"
                />
              </div>

              <div className="space-y-4">
                {cat.clues.map((clue, clueIndex) => (
                  <div key={clue.id} className={clueCard}>
                    <div className="mb-4 flex items-center justify-between">
                      <span className="font-archivist text-lg font-bold text-archivist-accent">
                        ${200 * (clueIndex + 1)}
                      </span>
                      <div className="flex items-center gap-1">
                        {cat.clues.length > 1 ? (
                          <button
                            type="button"
                            onClick={() => removeClue(catIndex, clueIndex)}
                            className="rounded-sm p-1 text-archivist-accent transition hover:bg-archivist-container hover:text-archivist-ink"
                            aria-label={`Remove ${200 * (clueIndex + 1)} clue`}
                          >
                            <MdClose className="h-4 w-4" aria-hidden />
                          </button>
                        ) : null}
                        <MdEditNote
                          className="h-5 w-5 text-archivist-outline-variant"
                          aria-hidden
                        />
                      </div>
                    </div>
                    <textarea
                      className={clueTextarea}
                      placeholder="Clue text…"
                      rows={3}
                      value={clue.question}
                      onChange={(e) =>
                        setClueField(
                          catIndex,
                          clueIndex,
                          "question",
                          e.target.value,
                        )
                      }
                    />
                    <div className="border-t border-archivist-outline-variant/20 pt-4">
                      <input
                        className={answerInput}
                        placeholder="Correct answer"
                        type="text"
                        value={clue.answer}
                        onChange={(e) =>
                          setClueField(
                            catIndex,
                            clueIndex,
                            "answer",
                            e.target.value,
                          )
                        }
                        autoComplete="off"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {cat.clues.length < 5 ? (
                <button
                  type="button"
                  onClick={() => addClue(catIndex)}
                  className={`${cleopardyUi.btnSecondary} w-full text-sm`}
                >
                  Add clue (${200 * (cat.clues.length + 1)})
                </button>
              ) : null}
            </div>
          ))}

          {categories.length < 5 ? (
            <button
              type="button"
              onClick={addCategory}
              className={`group ${colWidth} flex min-h-[28rem] flex-col items-center justify-center rounded-sm border-2 border-dashed border-archivist-outline-variant/40 bg-archivist-surface-low/40 transition hover:border-archivist-accent/50 hover:bg-archivist-surface-low/80`}
            >
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-archivist-surface-high shadow-sm transition group-hover:scale-105">
                <MdAdd className="h-8 w-8 text-archivist-accent" aria-hidden />
              </div>
              <h3 className="font-archivist text-lg font-bold text-archivist-ink">
                Add category
              </h3>
              <p className="mt-2 max-w-[12rem] px-4 text-center text-sm text-archivist-on-surface-variant">
                Up to five categories on the board
              </p>
            </button>
          ) : null}
        </div>
      </section>

      {issues.length > 0 ? (
        <div
          className="rounded-sm border border-amber-200/80 bg-amber-50/90 px-4 py-3 dark:border-amber-900/50 dark:bg-amber-950/30"
          role="status"
          aria-live="polite"
        >
          <p className="text-sm font-semibold text-archivist-ink">
            Complete the board to create a game
          </p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-archivist-on-surface-variant">
            {issues.slice(0, 8).map((line, i) => (
              <li key={i} className="font-mono">
                {line}
              </li>
            ))}
            {issues.length > 8 ? (
              <li className="font-sans">…and more</li>
            ) : null}
          </ul>
        </div>
      ) : (
        <p
          className="text-sm font-medium text-emerald-800 dark:text-emerald-200/90"
          role="status"
        >
          Board looks valid — you can create the game.
        </p>
      )}
    </div>
  );
}
