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
