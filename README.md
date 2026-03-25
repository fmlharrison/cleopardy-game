# Cleopardy (MVP)

Browser Jeopardy-style game: **Next.js** UI + **PartyKit** realtime room state.

## Install

```bash
npm install
```

## Run locally (realtime)

**One command** (PartyKit + Next.js in the same terminal):

```bash
npm run dev:all
```

Or use **two terminals** if you prefer separate logs:

```bash
npm run party:dev   # port 1999 (partykit.json)
npm run dev         # Next.js
```

PartyKit must be running before or as soon as you open a game room (WebSocket to `ws://…:1999/…`).

Open [http://localhost:3000](http://localhost:3000).

### Env / networking

- Default: the client talks to PartyKit on **`localhost:1999`** (or the same **LAN hostname** as the page on port **1999**).
- WebSocket path uses party id **`main`** (PartyKit’s default for `server.ts`), not necessarily `name` in `partykit.json`.
- Optional overrides: copy **`.env.example`** → **`.env.local`** and set `NEXT_PUBLIC_PARTYKIT_HOST`, `NEXT_PUBLIC_PARTYKIT_PORT`, or `NEXT_PUBLIC_PARTYKIT_PARTY` if your setup differs.

## Board format (reference)

A sample board JSON for tests or tooling lives at **`data/demo-board.json`**. The host UI builds boards in the browser (categories and clues); the same schema applies when sessions are created: `src/schemas/board-schema.ts` (unique clue ids across the board, **1–5** categories, **1–5** clues per category, clue values **$200–$1000** by row).

## Host flow

1. Go to **`/host`**.
2. Add category names and clues (optional board title; defaults to “Custom game”), then click **Create game**.
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
