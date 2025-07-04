import { Game } from "@/types/game";
import * as sqliteGameStore from "./sqliteGameStore";
import {
	getGame as getTursoGame,
	getGames as getTursoGames,
	saveGame as saveTursoGame,
	deleteGame as deleteTursoGame,
} from "./tursoGameStore";

// Use Turso by default, use local SQLite only if USE_LOCAL_DB is set to 'true'
export const USE_LOCAL_DB = false || process.env.USE_LOCAL_DB === "true";

console.log("[INFO] Using", USE_LOCAL_DB ? "SQLite" : "Turso", "database");

export async function getGames(): Promise<Game[]> {
	if (USE_LOCAL_DB) {
		return sqliteGameStore.getGames();
	} else {
		return await getTursoGames();
	}
}

export async function getGame(gameCode: string): Promise<Game | undefined> {
	if (USE_LOCAL_DB) {
		return sqliteGameStore.getGame(gameCode);
	} else {
		return await getTursoGame(gameCode);
	}
}

export async function setGame(gameCode: string, game: Game): Promise<void> {
	if (USE_LOCAL_DB) {
		sqliteGameStore.saveGame(game);
	} else {
		await saveTursoGame(game);
	}
}

export async function deleteGame(gameCode: string): Promise<void> {
	if (USE_LOCAL_DB) {
		sqliteGameStore.deleteGame(gameCode);
	} else {
		await deleteTursoGame(gameCode);
	}
}
