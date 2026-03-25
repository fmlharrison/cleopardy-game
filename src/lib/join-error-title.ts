/**
 * Short heading for common PartyKit join errors (body still shows server text).
 */
export function joinErrorTitle(message: string): string | undefined {
  const m = message.toLowerCase();
  if (m.includes("name is already taken")) {
    return "That name is taken";
  }
  if (m.includes("room is full")) {
    return "Lobby is full";
  }
  if (m.includes("already started") || m.includes("join is closed")) {
    return "Game already started";
  }
  if (m.includes("not found") || m.includes("host has not created")) {
    return "Session not ready";
  }
  if (m.includes("websocket") || m.includes("connection failed")) {
    return "Could not connect";
  }
  if (m.includes("closed before")) {
    return "Connection lost";
  }
  if (m.includes("timed out")) {
    return "Taking too long";
  }
  return undefined;
}
