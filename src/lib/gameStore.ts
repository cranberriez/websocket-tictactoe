import { Game } from "@/types/game";
import * as sqliteGameStore from './sqliteGameStore';

export function getGames(): Game[] {
  return sqliteGameStore.getGames();
}

export function getGame(gameCode: string): Game | undefined {
  return sqliteGameStore.getGame(gameCode);
}

export function setGame(gameCode: string, game: Game): void {
  // gameCode is already part of the Game object
  sqliteGameStore.saveGame(game);
}

export function deleteGame(gameCode: string): void {
  sqliteGameStore.deleteGame(gameCode);
}

