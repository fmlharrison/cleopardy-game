export type GameBoardArchivistFooterProps = {
  sessionCode: string;
};

export function GameBoardArchivistFooter({
  sessionCode,
}: GameBoardArchivistFooterProps) {
  return (
    <footer className="mt-16 grid grid-cols-1 gap-8 border-t border-archivist-outline-variant/20 pt-10 md:grid-cols-3 md:gap-12 md:pt-12">
      <div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-archivist-accent">
          Vault reference
        </span>
        <p className="mt-2 text-sm italic leading-relaxed text-archivist-on-surface-variant">
          Clues come from your imported board JSON. Verify sources for your own
          events.
        </p>
      </div>
      <div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-archivist-accent">
          Game ethics
        </span>
        <p className="mt-2 text-sm leading-relaxed text-archivist-on-surface-variant">
          Responses should be in the form of a question when you play aloud. The
          host’s call is final for this session.
        </p>
      </div>
      <div className="flex items-end justify-start md:justify-end">
        <div className="relative w-full max-w-xs overflow-hidden rounded-sm bg-archivist-container p-6">
          <div
            className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-archivist-accent/10 blur-2xl"
            aria-hidden
          />
          <p className="text-[10px] font-bold uppercase tracking-widest text-archivist-ink">
            Session ID
          </p>
          <p className="mt-1 font-mono text-xs text-archivist-accent">
            {sessionCode}
          </p>
        </div>
      </div>
    </footer>
  );
}
