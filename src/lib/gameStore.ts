import { Game } from "@/types/game";

// In-memory storage for game state (in a real app, you'd use a database)
// Using a global variable to ensure persistence across API route calls
let games: Map<string, Game> = new Map();

export function getGames(): Map<string, Game> {
  return games;
}

export function getGame(gameCode: string): Game | undefined {
  return games.get(gameCode);
}

export function setGame(gameCode: string, game: Game): void {
  games.set(gameCode, game);
}

export function deleteGame(gameCode: string): boolean {
  return games.delete(gameCode);
}
