import { Game } from "@/types/game";
import * as sqliteGameStore from "./sqliteGameStore";
import * as tursoGameStore from "./tursoGameStore";

// Toggle this constant to switch between Turso and local SQLite
export const USE_TURSO_DB = process.env.USE_TURSO_DB === "true";

export async function getGames(): Promise<Game[]> {
	if (USE_TURSO_DB) {
		return await tursoGameStore.getGames();
	} else {
		return sqliteGameStore.getGames();
	}
}

export async function getGame(gameCode: string): Promise<Game | undefined> {
	if (USE_TURSO_DB) {
		return await tursoGameStore.getGame(gameCode);
	} else {
		return sqliteGameStore.getGame(gameCode);
	}
}

export async function setGame(gameCode: string, game: Game): Promise<void> {
	if (USE_TURSO_DB) {
		await tursoGameStore.saveGame(game);
	} else {
		sqliteGameStore.saveGame(game);
	}
}

export async function deleteGame(gameCode: string): Promise<void> {
	if (USE_TURSO_DB) {
		await tursoGameStore.deleteGame(gameCode);
	} else {
		sqliteGameStore.deleteGame(gameCode);
	}
}
