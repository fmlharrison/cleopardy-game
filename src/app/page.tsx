import Link from "next/link";

import { ui } from "@/lib/ui";

export default function HomePage() {
  return (
    <main className={`${ui.page} ${ui.pageNarrow} ${ui.stack}`}>
      <header className="space-y-3">
        <p className={ui.eyebrow}>Multiplayer trivia</p>
        <h1 className={ui.h1}>Cleopardy</h1>
        <p className={ui.lead}>
          Host a room with your board JSON, or join with a session code from the
          host.
        </p>
      </header>

      <div className={ui.actionCard}>
        <p className={`${ui.helper} mb-4 sm:mb-5`}>
          Choose how you’re entering.
        </p>
        <nav className="flex flex-col gap-3 sm:flex-row sm:gap-4">
          <Link
            className={`${ui.btnPrimary} w-full sm:min-w-[11rem]`}
            href="/host"
          >
            Host a game
          </Link>
          <Link
            className={`${ui.btnSecondary} w-full sm:min-w-[11rem]`}
            href="/join"
          >
            Join a game
          </Link>
        </nav>
      </div>
    </main>
  );
}
