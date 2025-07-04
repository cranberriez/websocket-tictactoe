import { Game } from "@/types/game";
import * as sqliteGameStore from "./sqliteGameStore";
import * as tursoGameStore from "./tursoGameStore";

// Use Turso by default, use local SQLite only if USE_LOCAL_DB is set to 'true'
export const USE_LOCAL_DB = false || process.env.USE_LOCAL_DB === "true";

export async function getGames(): Promise<Game[]> {
	if (USE_LOCAL_DB) {
		return sqliteGameStore.getGames();
	} else {
		return await tursoGameStore.getGames();
	}
}

export async function getGame(gameCode: string): Promise<Game | undefined> {
	if (USE_LOCAL_DB) {
		return sqliteGameStore.getGame(gameCode);
	} else {
		return await tursoGameStore.getGame(gameCode);
	}
}

export async function setGame(gameCode: string, game: Game): Promise<void> {
	if (USE_LOCAL_DB) {
		sqliteGameStore.saveGame(game);
	} else {
		await tursoGameStore.saveGame(game);
	}
}

export async function deleteGame(gameCode: string): Promise<void> {
	if (USE_LOCAL_DB) {
		sqliteGameStore.deleteGame(gameCode);
	} else {
		await tursoGameStore.deleteGame(gameCode);
	}
}
