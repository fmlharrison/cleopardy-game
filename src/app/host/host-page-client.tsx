"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { BoardBuilder } from "@/components/host/BoardBuilder";
import { CreateGamePlaceholderButton } from "@/components/CreateGamePlaceholderButton";
import { StatusBanner } from "@/components/ui/StatusBanner";
import { createHostSession } from "@/lib/create-host-session";
import { getOrCreateStoredId, STORAGE_KEYS } from "@/lib/ids";
import { generateSessionCode } from "@/lib/session-code";
import { cleopardyUi } from "@/lib/ui";
import type { Board } from "@/types/game";

export function HostPageClient() {
  const router = useRouter();
  const createAbortRef = useRef<AbortController | null>(null);

  const [validatedBoard, setValidatedBoard] = useState<Board | null>(null);
  const [createPending, setCreatePending] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const onValidBoardChange = useCallback((board: Board | null) => {
    setValidatedBoard(board);
    setCreateError(null);
  }, []);

  useEffect(() => {
    return () => {
      createAbortRef.current?.abort();
    };
  }, []);

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
    <div className={`${cleopardyUi.stackLoose} w-full pb-4`}>
      <BoardBuilder onValidBoardChange={onValidBoardChange} />

      <section
        className="mt-4 flex flex-col gap-5 border-t border-archivist-outline-variant/20 pt-10"
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

      <Link href="/" className={cleopardyUi.linkBack}>
        ← Home
      </Link>
    </div>
  );
}
