import { ui } from "@/lib/ui";

type CreateGamePlaceholderButtonProps = {
  disabled: boolean;
  onCreateGame?: () => void;
  isLoading?: boolean;
};

export function CreateGamePlaceholderButton({
  disabled,
  onCreateGame,
  isLoading = false,
}: CreateGamePlaceholderButtonProps) {
  const busy = Boolean(isLoading);
  const isDisabled = disabled || busy;

  return (
    <section aria-labelledby="create-heading" className="space-y-4">
      <h2 id="create-heading" className={ui.sectionTitle}>
        Create session
      </h2>
      <p className={ui.helper}>
        Opens the PartyKit room for your validated board. Locally, use{" "}
        <code className="rounded bg-zinc-200 px-1 dark:bg-zinc-800">
          npm run dev:all
        </code>{" "}
        or{" "}
        <code className="rounded bg-zinc-200 px-1 dark:bg-zinc-800">
          npm run party:dev
        </code>{" "}
        so the WebSocket can connect.
      </p>
      <button
        type="button"
        disabled={isDisabled}
        onClick={() => onCreateGame?.()}
        className={ui.btnPrimary}
      >
        {busy ? "Creating…" : "Create game"}
      </button>
    </section>
  );
}
