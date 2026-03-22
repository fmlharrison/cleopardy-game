# Cleopardy (MVP)

Browser Jeopardy-style game: **Next.js** UI + **PartyKit** realtime room state.

## Install

```bash
npm install
```

## Run locally (realtime)

Use **two terminals**. PartyKit must be up before or as soon as you open a game room (WebSocket to `ws://…:1999/…`).

```bash
# Terminal 1 — PartyKit (port 1999, see partykit.json)
npm run party:dev

# Terminal 2 — Next.js
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Env / networking

- Default: the client talks to PartyKit on **`localhost:1999`** (or the same **LAN hostname** as the page on port **1999**).
- WebSocket path uses party id **`main`** (PartyKit’s default for `server.ts`), not necessarily `name` in `partykit.json`.
- Optional overrides: copy **`.env.example`** → **`.env.local`** and set `NEXT_PUBLIC_PARTYKIT_HOST`, `NEXT_PUBLIC_PARTYKIT_PORT`, or `NEXT_PUBLIC_PARTYKIT_PARTY` if your setup differs.

## Demo board JSON

A small valid board lives at **`data/demo-board.json`**. On **`/host`**, paste the JSON or use **Upload a board file** to load it, then validate and create the session. Schema: `src/schemas/board-schema.ts` (unique clue ids across the board, 1–6 categories, 1–5 clues per category).

## Host flow

1. Go to **`/host`**.
2. Create a session with a board (use **`data/demo-board.json`** for a quick test).
3. Open the game link you get (includes **`?role=host`**). Keep this tab/device as host — `localStorage` stores the host id.

## Join flow

1. Go to **`/join`**.
2. Enter the session code and display name.
3. Open the game link (**`?role=player`**). `localStorage` stores the player id for reconnect.

## Next.js only (no WebSocket)

```bash
npm run dev
```

Lobby/game features that need PartyKit will not work until **`npm run party:dev`** is running.

---

Bootstrapped with [create-next-app](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).
