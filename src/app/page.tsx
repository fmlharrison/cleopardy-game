import Link from "next/link";

import { ui } from "@/lib/ui";

export default function HomePage() {
  return (
    <main className={`${ui.page} ${ui.pageNarrow} ${ui.stack}`}>
      <div>
        <h1 className={ui.h1}>Cleopardy</h1>
        <p className={ui.lead}>
          Jeopardy-style multiplayer (MVP). Host a game or join with a session
          code.
        </p>
      </div>
      <nav className="flex flex-col gap-3 sm:flex-row">
        <Link className={`${ui.btnPrimary} flex-1 sm:flex-none`} href="/host">
          Host a game
        </Link>
        <Link className={`${ui.btnSecondary} flex-1 sm:flex-none`} href="/join">
          Join a game
        </Link>
      </nav>
    </main>
  );
}
