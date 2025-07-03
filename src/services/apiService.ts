import { GameEvent, GameEventType, PlayerSymbol } from "@/types/game";

/**
 * API Service for handling all game-related API requests
 */
class ApiService {
  /**
   * Base method for sending game events to the server
   */
  async sendGameEvent(event: GameEvent): Promise<Response> {
    try {
      return await fetch("/api/game", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(event),
      });
    } catch (error) {
      console.error(`Error sending ${event.event} event:`, error);
      throw error;
    }
  }

  /**
   * Handle game move events
   */
  async sendGameMove(gameId: string, squares: Array<string | null>, nextPlayer: PlayerSymbol): Promise<Response> {
    return this.sendGameEvent({
      gameId,
      event: "game-move",
      squares,
      nextPlayer,
    });
  }

  /**
   * Handle player joining a game
   */
  async joinGame(gameId: string, playerId: string): Promise<Response> {
    return this.sendGameEvent({
      gameId,
      event: "player-join",
      playerId,
    });
  }

  /**
   * Handle game starting
   */
  async startGame(gameId: string, nextPlayer: PlayerSymbol): Promise<Response> {
    return this.sendGameEvent({
      gameId,
      event: "game-start",
      nextPlayer,
    });
  }

  /**
   * Handle game reset
   */
  async resetGame(gameId: string, nextPlayer: PlayerSymbol): Promise<Response> {
    return this.sendGameEvent({
      gameId,
      event: "game-reset",
      nextPlayer,
    });
  }

  /**
   * Handle game end
   */
  async endGame(gameId: string, winner: string | null): Promise<Response> {
    return this.sendGameEvent({
      gameId,
      event: "game-end",
      winner,
    });
  }
}

// Export singleton instance
export const apiService = new ApiService();
