import { cleopardyUi } from "@/lib/ui";

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
      <h2 id="create-heading" className={cleopardyUi.sectionTitle}>
        Create session
      </h2>
      <button
        type="button"
        disabled={isDisabled}
        onClick={() => onCreateGame?.()}
        className={`${cleopardyUi.btnPrimary} px-10 py-4 text-base font-bold shadow-md shadow-black/10 transition hover:opacity-95 md:px-12`}
      >
        {busy ? "Creating…" : "Create game"}
      </button>
    </section>
  );
}
