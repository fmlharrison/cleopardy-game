"use client";

import Link from "next/link";
import { useCallback, useState } from "react";

import { BoardPreviewSection } from "@/components/BoardPreviewSection";
import { BoardValidationSection } from "@/components/BoardValidationSection";
import { CreateGamePlaceholderButton } from "@/components/CreateGamePlaceholderButton";
import { JsonImportForm } from "@/components/JsonImportForm";
import { validateBoardJson } from "@/lib/validate-board-json";
import type { Board } from "@/types/game";
import type { BoardImportValidation } from "@/types/board-import";

function applyValidationResult(raw: string): {
  validation: BoardImportValidation;
  validatedBoard: Board | null;
} {
  const result = validateBoardJson(raw);
  switch (result.outcome) {
    case "empty":
      return { validation: { kind: "empty" }, validatedBoard: null };
    case "syntax":
      return {
        validation: { kind: "syntax", message: result.message },
        validatedBoard: null,
      };
    case "schema":
      return {
        validation: { kind: "schema", error: result.error },
        validatedBoard: null,
      };
    case "ok":
      return { validation: { kind: "ok" }, validatedBoard: result.board };
  }
}

export function HostPageClient() {
  const [rawJson, setRawJson] = useState("");
  const [validation, setValidation] = useState<BoardImportValidation>({
    kind: "idle",
  });
  const [validatedBoard, setValidatedBoard] = useState<Board | null>(null);

  const handleRawJsonChange = useCallback((value: string) => {
    setRawJson(value);
    setValidation({ kind: "idle" });
    setValidatedBoard(null);
  }, []);

  const runValidation = useCallback((raw: string) => {
    const next = applyValidationResult(raw);
    setValidation(next.validation);
    setValidatedBoard(next.validatedBoard);
  }, []);

  const handleValidate = useCallback(() => {
    runValidation(rawJson);
  }, [rawJson, runValidation]);

  const handleLoadRawJson = useCallback(
    (raw: string) => {
      setRawJson(raw);
      runValidation(raw);
    },
    [runValidation],
  );

  return (
    <main className="mx-auto flex min-h-full max-w-3xl flex-col gap-10 px-6 py-16">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Host</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Import board JSON, validate with the shared schema, then create a
          session (next step). Raw editor text and the validated board are kept
          separate—editing clears the validated board until you validate again.
        </p>
      </div>

      <JsonImportForm
        rawJson={rawJson}
        onRawJsonChange={handleRawJsonChange}
        onValidate={handleValidate}
        onLoadRawJson={handleLoadRawJson}
      />

      <BoardValidationSection validation={validation} />

      <BoardPreviewSection board={validatedBoard} />

      <CreateGamePlaceholderButton disabled={validatedBoard === null} />

      <Link
        href="/"
        className="text-sm font-medium text-zinc-700 underline dark:text-zinc-300"
      >
        ← Back
      </Link>
    </main>
  );
}
