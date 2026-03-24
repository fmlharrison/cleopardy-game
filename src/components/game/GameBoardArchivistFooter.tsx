export type GameBoardArchivistFooterProps = {
  sessionCode: string;
};

export function GameBoardArchivistFooter({
  sessionCode,
}: GameBoardArchivistFooterProps) {
  return (
    <footer className="mt-16 grid grid-cols-1 gap-8 border-t border-archivist-outline-variant/20 pt-10 md:grid-cols-3 md:gap-12 md:pt-12">
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
