"use client";

import { useCallback, useId, useState } from "react";
import type { z } from "zod";

import { parseBoard } from "@/schemas/board-schema";
import type { Board } from "@/types/game";

type ValidationState =
  | { kind: "idle" }
  | { kind: "empty" }
  | { kind: "syntax"; message: string }
  | { kind: "schema"; error: z.ZodError }
  | { kind: "ok"; board: Board };

function formatZodIssues(error: z.ZodError): string[] {
  return error.issues.map((issue) => {
    const path =
      issue.path.length > 0 ? issue.path.map(String).join(".") : "(root)";
    return `${path}: ${issue.message}`;
  });
}

export function JsonImportForm() {
  const fileInputId = useId();
  const [jsonText, setJsonText] = useState("");
  const [validation, setValidation] = useState<ValidationState>({
    kind: "idle",
  });

  const runValidation = useCallback((raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) {
      setValidation({ kind: "empty" });
      return;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(trimmed) as unknown;
    } catch (e) {
      const message = e instanceof Error ? e.message : "Invalid JSON syntax.";
      setValidation({ kind: "syntax", message });
      return;
    }

    const result = parseBoard(parsed);
    if (!result.ok) {
      setValidation({ kind: "schema", error: result.error });
      return;
    }

    setValidation({ kind: "ok", board: result.board });
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }
    const text = await file.text();
    setJsonText(text);
    runValidation(text);
    e.target.value = "";
  };

  const handleValidateClick = () => {
    runValidation(jsonText);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <label
          htmlFor={fileInputId}
          className="text-sm font-medium text-zinc-800 dark:text-zinc-200"
        >
          Upload a board file
        </label>
        <input
          id={fileInputId}
          type="file"
          accept=".json,application/json"
          onChange={handleFileChange}
          className="block w-full max-w-md text-sm text-zinc-600 file:mr-3 file:rounded-md file:border file:border-zinc-300 file:bg-white file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-zinc-800 hover:file:bg-zinc-50 dark:text-zinc-400 dark:file:border-zinc-600 dark:file:bg-zinc-900 dark:file:text-zinc-200 dark:hover:file:bg-zinc-800"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="board-json-textarea"
          className="text-sm font-medium text-zinc-800 dark:text-zinc-200"
        >
          Or paste JSON
        </label>
        <textarea
          id="board-json-textarea"
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
          rows={14}
          spellCheck={false}
          placeholder='{"title": "…", "categories": [ … ]}'
          className="w-full max-w-2xl rounded-md border border-zinc-300 bg-white px-3 py-2 font-mono text-sm text-zinc-900 shadow-sm outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-400 dark:focus:ring-zinc-400"
        />
      </div>

      <div>
        <button
          type="button"
          onClick={handleValidateClick}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Validate board
        </button>
      </div>

      {validation.kind === "empty" && (
        <p className="text-sm text-amber-800 dark:text-amber-200" role="status">
          Add JSON (paste or upload), then validate.
        </p>
      )}

      {validation.kind === "syntax" && (
        <div
          className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
          role="alert"
        >
          <p className="font-medium">JSON syntax error</p>
          <p className="mt-1 font-mono text-xs">{validation.message}</p>
        </div>
      )}

      {validation.kind === "schema" && (
        <div
          className="rounded-md border border-red-300 bg-red-50 px-3 py-2 dark:border-red-900 dark:bg-red-950/40"
          role="alert"
        >
          <p className="text-sm font-medium text-red-900 dark:text-red-200">
            Board does not match the required format
          </p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-red-800 dark:text-red-200/90">
            {formatZodIssues(validation.error).map((line, i) => (
              <li key={i} className="font-mono text-xs">
                {line}
              </li>
            ))}
          </ul>
        </div>
      )}

      {validation.kind === "ok" && (
        <div className="rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900/50">
          <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
            Preview
          </p>
          <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              Title:
            </span>{" "}
            {validation.board.title}
          </p>
          <ul className="mt-3 space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
            {validation.board.categories.map((cat) => (
              <li key={cat.id}>
                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                  {cat.name}
                </span>
                <span className="text-zinc-500 dark:text-zinc-500">
                  {" "}
                  — {cat.clues.length}{" "}
                  {cat.clues.length === 1 ? "clue" : "clues"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
