/**
 * Tracks WebSocket connections per Party room so we can set `Player.connected`
 * when the last socket for a playerId closes (multi-tab safe).
 */
export class RoomConnectionTracker {
  /** playerId -> connection ids */
  private readonly playerConnIds = new Map<string, Set<string>>();
  private readonly connToPlayer = new Map<string, string>();
  private readonly hostConnIds = new Set<string>();

  private clearConn(connId: string): void {
    if (this.hostConnIds.delete(connId)) {
      return;
    }
    const playerId = this.connToPlayer.get(connId);
    if (!playerId) {
      return;
    }
    this.connToPlayer.delete(connId);
    const set = this.playerConnIds.get(playerId);
    if (set) {
      set.delete(connId);
      if (set.size === 0) {
        this.playerConnIds.delete(playerId);
      }
    }
  }

  /** Register this socket as the host (clears any prior binding for the same socket). */
  attachHost(connId: string): void {
    this.clearConn(connId);
    this.hostConnIds.add(connId);
  }

  /** Roster player id for this socket after `attachPlayer`, if any. */
  getPlayerIdForConnection(connId: string): string | null {
    return this.connToPlayer.get(connId) ?? null;
  }

  /** Register this socket for a roster player. */
  attachPlayer(connId: string, playerId: string): void {
    this.clearConn(connId);
    let set = this.playerConnIds.get(playerId);
    if (!set) {
      set = new Set();
      this.playerConnIds.set(playerId, set);
    }
    set.add(connId);
    this.connToPlayer.set(connId, playerId);
  }

  /**
   * On socket close: if this was a player’s last connection, returns their playerId
   * so the room can set `connected: false`. Host sockets return null (no room field).
   */
  onConnectionClosed(connId: string): string | null {
    if (this.hostConnIds.delete(connId)) {
      return null;
    }
    const playerId = this.connToPlayer.get(connId);
    if (!playerId) {
      return null;
    }
    this.connToPlayer.delete(connId);
    const set = this.playerConnIds.get(playerId);
    if (!set) {
      return playerId;
    }
    set.delete(connId);
    if (set.size === 0) {
      this.playerConnIds.delete(playerId);
      return playerId;
    }
    return null;
  }
}
