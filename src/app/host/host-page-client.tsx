"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { BoardPreviewSection } from "@/components/BoardPreviewSection";
import { BoardValidationSection } from "@/components/BoardValidationSection";
import { CreateGamePlaceholderButton } from "@/components/CreateGamePlaceholderButton";
import { JsonImportForm } from "@/components/JsonImportForm";
import { StatusBanner } from "@/components/ui/StatusBanner";
import { createHostSession } from "@/lib/create-host-session";
import { getOrCreateStoredId, STORAGE_KEYS } from "@/lib/ids";
import { generateSessionCode } from "@/lib/session-code";
import { ui } from "@/lib/ui";
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
  const router = useRouter();
  const createAbortRef = useRef<AbortController | null>(null);

  const [rawJson, setRawJson] = useState("");
  const [validation, setValidation] = useState<BoardImportValidation>({
    kind: "idle",
  });
  const [validatedBoard, setValidatedBoard] = useState<Board | null>(null);
  const [createPending, setCreatePending] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      createAbortRef.current?.abort();
    };
  }, []);

  const handleRawJsonChange = useCallback((value: string) => {
    setRawJson(value);
    setValidation({ kind: "idle" });
    setValidatedBoard(null);
    setCreateError(null);
  }, []);

  const runValidation = useCallback((raw: string) => {
    const next = applyValidationResult(raw);
    setValidation(next.validation);
    setValidatedBoard(next.validatedBoard);
    setCreateError(null);
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

  const handleCreateGame = useCallback(async () => {
    if (!validatedBoard) {
      return;
    }
    createAbortRef.current?.abort();
    const ac = new AbortController();
    createAbortRef.current = ac;
    setCreateError(null);
    setCreatePending(true);

    const sessionCode = generateSessionCode();
    const hostId = getOrCreateStoredId(STORAGE_KEYS.hostId);

    try {
      const result = await createHostSession({
        sessionCode,
        hostId,
        board: validatedBoard,
        signal: ac.signal,
      });

      if (!result.ok) {
        setCreateError(result.message);
        return;
      }

      router.push(`/game/${encodeURIComponent(sessionCode)}?role=host`);
    } finally {
      setCreatePending(false);
      if (createAbortRef.current === ac) {
        createAbortRef.current = null;
      }
    }
  }, [validatedBoard, router]);

  return (
    <main className={`${ui.page} ${ui.pageHost} ${ui.stackLoose}`}>
      <header className="border-b border-zinc-200 pb-8 dark:border-zinc-800">
        <p className={ui.eyebrow}>Host a session</p>
        <h1 className={ui.h1}>Host</h1>
        <p className={ui.lead}>
          Import board JSON, validate it, then create a PartyKit room. Editing
          the text clears validation until you run{" "}
          <span className="font-medium text-zinc-700 dark:text-zinc-300">
            Validate board
          </span>{" "}
          again.
        </p>
      </header>

      <div className="flex flex-col gap-8">
        <div className="space-y-2">
          <h2 className={ui.sectionTitle}>Board setup</h2>
          <p className={ui.helper}>
            Upload or paste JSON, then validate. Preview updates after a
            successful check.
          </p>
        </div>

        <div className={`${ui.surfacePanel} space-y-8 p-5 sm:p-6`}>
          <JsonImportForm
            rawJson={rawJson}
            onRawJsonChange={handleRawJsonChange}
            onValidate={handleValidate}
            onLoadRawJson={handleLoadRawJson}
          />
          <div className="border-t border-zinc-200 pt-8 dark:border-zinc-700">
            <BoardValidationSection validation={validation} />
          </div>
          <div className="border-t border-zinc-200 pt-8 dark:border-zinc-700">
            <BoardPreviewSection board={validatedBoard} />
          </div>
        </div>
      </div>

      <section
        className="flex flex-col gap-5 border-t border-zinc-200 pt-10 dark:border-zinc-800"
        aria-labelledby="create-heading"
      >
        {createPending ? (
          <StatusBanner variant="info" title="Creating session">
            <p>
              Contacting PartyKit and registering your board. This usually takes
              a moment.
            </p>
          </StatusBanner>
        ) : null}

        {createError ? (
          <StatusBanner variant="error" title="Could not create game">
            <p>{createError}</p>
          </StatusBanner>
        ) : null}

        <CreateGamePlaceholderButton
          disabled={validatedBoard === null}
          onCreateGame={handleCreateGame}
          isLoading={createPending}
        />
      </section>

      <Link href="/" className={ui.linkBack}>
        ← Home
      </Link>
    </main>
  );
}
