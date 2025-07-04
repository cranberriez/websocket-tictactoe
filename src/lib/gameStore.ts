import { Game } from "@/types/game";

// In-memory storage for game state (in a real app, you'd use a database)
// Using a global variable to ensure persistence across API route calls
let games: Map<string, Game> = new Map();

export function getGames(): Map<string, Game> {
  console.log('[GAMESTORE] getGames called. Current games:', Array.from(games.keys()));
  return games;
}

export function getGame(gameCode: string): Game | undefined {
  const game = games.get(gameCode);
  console.log(`[GAMESTORE] getGame called for code: ${gameCode}. Found:`, !!game);
  return game;
}

export function setGame(gameCode: string, game: Game): void {
  games.set(gameCode, game);
  console.log(`[GAMESTORE] setGame called for code: ${gameCode}. Total games:`, games.size);
}

export function deleteGame(gameCode: string): boolean {
  const deleted = games.delete(gameCode);
  console.log(`[GAMESTORE] deleteGame called for code: ${gameCode}. Deleted:`, deleted);
  return deleted;
}
