# Cleopardy MVP — plan

Lightweight browser Jeopardy-style multiplayer: one host, up to 6 players, session code, JSON board import, PartyKit as authoritative state. **No P2P, no WebRTC.** Client is not authoritative for buzzing or scoring.

## Stack

- Next.js, TypeScript, Tailwind CSS
- PartyKit (room = source of truth)
- **Partysocket** (PartyKit client; WebSocket to the room with reconnect / backoff — browser dependency for the Next app)
- Zod (board JSON + message validation as needed)

## Product scope (in)

| # | Deliverable |
|---|-------------|
| 1 | Landing page (`/`) |
| 2 | Host page: import JSON board (`/host`) |
| 3 | Join page: name + session code (`/join`) |
| 4 | Lobby |
| 5 | Game board |
| 6 | Clue view + buzzing |
| 7 | Host judging controls |
| 8 | Live scoreboard |
| 9 | End-game leaderboard + winner callout |
| 10 | Basic reconnect: stable `localStorage` IDs **plus** Partysocket transport reconnect (backoff), still reconciled on the server |

## Explicitly out of scope

Authentication; in-app board editor; database persistence; timers; Final Jeopardy; Daily Doubles; spectators; voice/video; heavy animations; mobile native apps; admin systems; complex rule variants.

## Routes

| Path | Role |
|------|------|
| `/` | Landing |
| `/host` | Host: create session, import board |
| `/join` | Player: enter code + name |
| `/game/[sessionCode]` | Lobby + board + clue + scoreboard + end state (same room URL; UI by phase/role) |

## Game rules (MVP)

- Max **6** players; **duplicate names rejected**.
- Players join **only before** game starts; host starts from lobby.
- Host opens a clue; players buzz while clue is open and buzzing is open.
- **First valid buzz** wins (server decides).
- Host marks **correct** → add clue value to that player’s score, close clue.
- **Incorrect** → no score change; clue stays active; host may **reopen** buzzing.
- End: all clues answered **or** host manually ends game.
- Final ranking: **score descending**, tie-break **join order ascending** (lower join order wins ties).

## Phases (`GamePhase`)

| Phase | Meaning (high level) |
|-------|----------------------|
| `lobby` | Waiting; players can join |
| `board` | Game in progress; grid visible |
| `clue_open` | A clue is shown; buzzing may be open or locked to a winner |
| `judging` | Host deciding correct/incorrect for buzz winner |
| `game_over` | Show final leaderboard |

Exact transitions are implemented in PartyKit; phases above are the contract from the requirements.

## Shared domain model (`types/game.ts` or equivalent)

```ts
export type Clue = {
  id: string;
  value: number;
  question: string;
  answer: string;
};

export type Category = {
  id: string;
  name: string;
  clues: Clue[];
};

export type Board = {
  title: string;
  categories: Category[];
};

export type Player = {
  id: string;
  name: string;
  score: number;
  connected: boolean;
  joinOrder: number;
};

export type GamePhase =
  | "lobby"
  | "board"
  | "clue_open"
  | "judging"
  | "game_over";

export type RoomState = {
  sessionCode: string;
  hostId: string | null;
  phase: GamePhase;
  board: Board | null;
  players: Player[];
  answeredClueIds: string[];
  currentClueId: string | null;
  buzzOpen: boolean;
  buzzWinnerPlayerId: string | null;
};
```

Add `RankedPlayer` (or equivalent) for end-game payloads as required by `GAME_ENDED` (e.g. `playerId`, `name`, `score`, `rank`, `joinOrder` — keep minimal).

## Client → server messages (`types/messages.ts`)

```ts
type ClientMessage =
  | { type: "HOST_CREATE_SESSION"; hostId: string; board: Board }
  | { type: "JOIN_SESSION"; playerId: string; name: string }
  | { type: "RECONNECT_PLAYER"; playerId: string }
  | { type: "START_GAME"; actorId: string }
  | { type: "OPEN_CLUE"; actorId: string; clueId: string }
  | { type: "BUZZ"; playerId: string }
  | { type: "MARK_CORRECT"; actorId: string; playerId: string }
  | { type: "MARK_INCORRECT"; actorId: string; playerId: string }
  | { type: "REOPEN_BUZZ"; actorId: string }
  | { type: "CLOSE_CLUE"; actorId: string }
  | { type: "END_GAME"; actorId: string };
```

- `actorId` = host identity for host-only actions; `playerId` = player identity for buzz / join / reconnect.

## Server → client messages

```ts
type ServerMessage =
  | { type: "SESSION_STATE"; state: RoomState }
  | { type: "ERROR"; message: string }
  | { type: "BUZZ_LOCKED"; playerId: string }
  | { type: "GAME_ENDED"; rankings: RankedPlayer[] };
```

Broadcast `SESSION_STATE` after meaningful mutations so all clients stay in sync. Use `ERROR` for rejected actions. `BUZZ_LOCKED` / `GAME_ENDED` as specified when those events occur.

## JSON board format & Zod (`schemas/board-schema.ts`)

Supported shape:

```json
{
  "title": "General Knowledge",
  "categories": [
    {
      "id": "cat-1",
      "name": "Science",
      "clues": [
        {
          "id": "science-100",
          "value": 100,
          "question": "What planet is known as the Red Planet?",
          "answer": "Mars"
        }
      ]
    }
  ]
}
```

Validation:

- `title` required string
- **1–6** categories
- **1–5** clues per category
- `value`: positive integer
- All `id` fields non-empty strings
- **Unique** category IDs across board; **unique** clue IDs across board

## PartyKit authority (`partykit/server.ts`)

Enforce in the room handler (not only UI):

| Rule | Enforcement |
|------|-------------|
| Start game | Only host (`actorId === hostId`) |
| Open clue | Only host; clue not in `answeredClueIds`; clue exists on board |
| Buzz | Sender is a known player; phase allows; `buzzOpen`; first valid wins |
| Mark correct / incorrect / reopen buzz / close clue / end game | Only host |
| Max players | Reject join when 6 players already |
| Duplicate names | Reject |
| Late join | Reject if phase ≠ `lobby` |
| Scoring | Server updates scores; incorrect never subtracts |

## Reconnect & identity (`lib/ids.ts` + client)

- Persist `hostId` and `playerId` in `localStorage`.
- **Transport:** Game clients connect to the PartyKit room with **Partysocket** (`PartySocket`, or the official React hook if the app standardizes on it) so drops, sleep, and flaky networks get **automatic reconnect** without hand-rolled `WebSocket` retry logic.
- **Application:** On a new socket after reconnect, send **`RECONNECT_PLAYER`** (and/or rely on `onConnect` + known id) so the server can set `connected: true` and avoid treating the session as a brand-new player. Refresh reuses the same id; roster updates must **not** duplicate entries.
- Disconnected players remain in `players` with `connected: false`. The PartyKit room remains authoritative; Partysocket only manages the client socket lifecycle.

## Preferred file layout

Unless the repo already diverges:

```
src/
  app/
    page.tsx
    host/page.tsx
    join/page.tsx
    game/[sessionCode]/page.tsx
components/
  BoardGrid.tsx
  ClueView.tsx
  EndGameLeaderboard.tsx
  JsonImportForm.tsx
  LobbyPanel.tsx
  Scoreboard.tsx
lib/
  ids.ts
  ranking.ts
  session-code.ts
  websocket.ts
schemas/
  board-schema.ts
types/
  game.ts
  messages.ts
partykit/
  server.ts
```

**`lib/websocket.ts`:** Small factory (e.g. `createPartySocket`) that returns **Partysocket**'s `PartySocket` for the configured host / party / room, and attaches shared **JSON helpers** (`stringifyClientMessage` / `parseServerMessage`) to incoming `message` events. Prefer Partysocket's URL/host options over duplicating PartyKit path rules in app code.

## UI (MVP)

- Clear host vs player affordances
- Session code visible in lobby
- Scoreboard visible during play
- Large buzz button; disable invalid actions
- End screen: ranked list + winner emphasis

## Engineering style

Strict TypeScript; small files; thin client state (derive UI from `SESSION_STATE`); no Redux/heavy global state unless unavoidable; minimal comments; no dead code; simplest behavior when ambiguous.

## Implementation milestones (suggested phases)

Work in whatever order you prefer; this matches the numbered scope and dependencies.

1. **Types & schemas** — `types/game.ts`, `types/messages.ts`, `schemas/board-schema.ts`, `lib/ranking.ts` (sort: score desc, joinOrder asc).
2. **PartyKit core** — `partykit/server.ts`: room state, message handling, host/player rules, buzz winner, score updates, `SESSION_STATE` broadcasts.
3. **Web client plumbing** — `lib/websocket.ts` using **Partysocket**, `lib/session-code.ts`, `lib/ids.ts` + `localStorage` wiring.
4. **Pages** — `/`, `/host` (JSON import via `JsonImportForm`), `/join`, `/game/[sessionCode]`.
5. **Components** — `LobbyPanel`, `BoardGrid`, `ClueView`, `Scoreboard`, `EndGameLeaderboard`; host controls vs player buzz.
6. **Polish & edge cases** — verify behavior after **Partysocket** reconnect (latest `SESSION_STATE`, when to send `RECONNECT_PLAYER`, no double-join), `ERROR` UX, disabled buttons from state, winner callout.

---

*This document reflects the agreed MVP only; future prompts can implement phase-by-phase against this plan.*
